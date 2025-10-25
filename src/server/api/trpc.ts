/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, type UserRole } from "@/server/db/schema";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
/**
 * Tenant isolation middleware
 * 
 * Adds tenant context to procedures and enforces multi-tenant data isolation
 */
const tenantMiddleware = t.middleware(async ({ ctx, next }) => {
  console.log('[TRPC DEBUG] Tenant middleware - session:', ctx.session ? {
    userId: ctx.session.user?.id,
    userEmail: ctx.session.user?.email,
    tenantId: ctx.session.user?.tenantId,
    role: ctx.session.user?.role
  } : 'No session');
  
  if (!ctx.session?.user?.tenantId) {
    console.log('[TRPC DEBUG] Missing tenantId in session, throwing FORBIDDEN error');
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "User must belong to a tenant" 
    });
  }

  // Fetch fresh user data to ensure we have latest tenant/role info
  const userData = await db.select()
    .from(users)
    .where(eq(users.id, ctx.session.user.id))
    .limit(1);

  const user = userData[0];
  if (!user?.tenantId) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Invalid user or tenant data" 
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenantId: user.tenantId,
      userRole: user.role,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Role-based authorization middleware factory
 */
const requireRole = (allowedRoles: UserRole[]) =>
  t.middleware(async ({ ctx, next }) => {
    // Note: userRole is added by tenantMiddleware, which always runs before this
    const userRole = (ctx as { userRole?: UserRole }).userRole;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires one of: ${allowedRoles.join(", ")}`
      });
    }
    return next();
  });

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Multi-tenant procedure - requires authentication + tenant membership
 */
export const tenantProcedure = protectedProcedure.use(tenantMiddleware);

/**
 * Admin procedure - requires super_admin or support_admin role
 */
export const adminProcedure = tenantProcedure.use(
  requireRole(["super_admin", "support_admin"])
);

/**
 * Guardian procedure - requires guardian-level access or higher
 */
export const guardianProcedure = tenantProcedure.use(
  requireRole(["super_admin", "support_admin", "primary_guardian", "guardian"])
);

/**
 * Primary guardian procedure - requires primary guardian or admin access
 */
export const primaryGuardianProcedure = tenantProcedure.use(
  requireRole(["super_admin", "support_admin", "primary_guardian"])
);
