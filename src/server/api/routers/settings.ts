import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
  primaryGuardianProcedure,
} from "@/server/api/trpc";
import { tenants, users } from "@/server/db/schema";

export const settingsRouter = createTRPCRouter({
  // Get tenant settings (family/school information)
  getTenantSettings: guardianProcedure.query(async ({ ctx }) => {
    const [tenant] = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return {
      id: tenant.id,
      name: tenant.name,
      primaryEmail: tenant.primaryEmail,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      zipCode: tenant.zipCode,
      phone: tenant.phone,
    };
  }),

  // Update tenant settings (primary guardian only)
  updateTenantSettings: primaryGuardianProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        primaryEmail: z.string().email().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedTenant] = await ctx.db
        .update(tenants)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.primaryEmail && { primaryEmail: input.primaryEmail }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.state !== undefined && { state: input.state }),
          ...(input.zipCode !== undefined && { zipCode: input.zipCode }),
          ...(input.phone !== undefined && { phone: input.phone }),
        })
        .where(eq(tenants.id, ctx.tenantId))
        .returning();

      return updatedTenant;
    }),

  // Get all family members (users in the tenant)
  getFamilyMembers: guardianProcedure.query(async ({ ctx }) => {
    const members = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, ctx.tenantId));

    return members;
  }),

  // Update user role (primary guardian only)
  updateUserRole: primaryGuardianProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["primary_guardian", "guardian", "student"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found in this tenant");
      }

      return updatedUser;
    }),

  // Deactivate user (primary guardian only)
  deactivateUser: primaryGuardianProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Don't allow deactivating yourself
      if (input.userId === ctx.session.user.id) {
        throw new Error("Cannot deactivate your own account");
      }

      const [updatedUser] = await ctx.db
        .update(users)
        .set({ isActive: false })
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found in this tenant");
      }

      return updatedUser;
    }),
});
