import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  tenants,
  type UserRole,
} from "@/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      tenantId: string | null;
      role: UserRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string | null;
    role: UserRole | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    /**
     * ...add more providers here.
     *
     * We can add other providers like email/password authentication
     * for families who prefer not to use Google OAuth.
     */
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        // New user - create tenant and update user with tenant and role
        const familyName = user.name?.split(' ').slice(-1)[0] + " Family" || "Family";
        
        const [newTenant] = await db.insert(tenants).values({
          name: familyName,
          primaryEmail: user.email,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }).returning();

        // Update the user record with tenant and role
        await db.update(users)
          .set({ 
            tenantId: newTenant!.id, 
            role: "primary_guardian" 
          })
          .where(eq(users.id, user.id));
      }
    },
  },
  callbacks: {
    session: async ({ session, user }) => {
      // Fetch fresh user data to get tenant info
      const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const userData = dbUser[0];
      
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          tenantId: userData?.tenantId ?? null,
          role: userData?.role ?? null,
        },
      };
    },
  },
} satisfies NextAuthConfig;
