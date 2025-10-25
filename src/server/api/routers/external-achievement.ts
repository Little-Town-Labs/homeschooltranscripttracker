import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { externalAchievements, achievementCategoryEnum } from "@/server/db/schema";

export const externalAchievementRouter = createTRPCRouter({
  // Get all external achievements for a specific student
  getByStudent: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(externalAchievements)
        .where(
          and(
            eq(externalAchievements.tenantId, ctx.tenantId),
            eq(externalAchievements.studentId, input.studentId)
          )
        )
        .orderBy(desc(externalAchievements.certificateDate));
    }),

  // Get all external achievements for the tenant (all students)
  getAll: guardianProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(externalAchievements)
      .where(eq(externalAchievements.tenantId, ctx.tenantId))
      .orderBy(desc(externalAchievements.certificateDate));
  }),

  // Get a specific external achievement by ID
  getById: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const achievement = await ctx.db
        .select()
        .from(externalAchievements)
        .where(
          and(
            eq(externalAchievements.id, input.id),
            eq(externalAchievements.tenantId, ctx.tenantId)
          )
        )
        .limit(1);

      if (!achievement[0]) {
        throw new Error("External achievement not found");
      }

      return achievement[0];
    }),

  // Create a new external achievement
  create: guardianProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        title: z.string().min(1, "Title is required"),
        provider: z.string().min(1, "Provider is required"),
        category: z.enum(achievementCategoryEnum.enumValues),
        certificateDate: z.string(), // ISO date string
        certificateUrl: z.string().url().optional().or(z.literal("")),
        verificationUrl: z.string().url().optional().or(z.literal("")),
        metadata: z.record(z.any()).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newAchievement] = await ctx.db
        .insert(externalAchievements)
        .values({
          tenantId: ctx.tenantId,
          studentId: input.studentId,
          title: input.title,
          provider: input.provider,
          category: input.category,
          certificateDate: input.certificateDate,
          certificateUrl: input.certificateUrl || null,
          verificationUrl: input.verificationUrl || null,
          metadata: input.metadata || null,
          description: input.description || null,
          notes: input.notes || null,
        })
        .returning();

      return newAchievement;
    }),

  // Update an external achievement
  update: guardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        provider: z.string().min(1).optional(),
        category: z.enum(achievementCategoryEnum.enumValues).optional(),
        certificateDate: z.string().optional(),
        certificateUrl: z.string().url().optional().or(z.literal("")),
        verificationUrl: z.string().url().optional().or(z.literal("")),
        metadata: z.record(z.any()).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const [updatedAchievement] = await ctx.db
        .update(externalAchievements)
        .set(updateData)
        .where(
          and(
            eq(externalAchievements.id, id),
            eq(externalAchievements.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (!updatedAchievement) {
        throw new Error("External achievement not found or access denied");
      }

      return updatedAchievement;
    }),

  // Delete an external achievement
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedAchievement] = await ctx.db
        .delete(externalAchievements)
        .where(
          and(
            eq(externalAchievements.id, input.id),
            eq(externalAchievements.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (!deletedAchievement) {
        throw new Error("External achievement not found or access denied");
      }

      return deletedAchievement;
    }),

  // Get achievements grouped by provider
  getByProvider: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const achievements = await ctx.db
        .select()
        .from(externalAchievements)
        .where(
          and(
            eq(externalAchievements.tenantId, ctx.tenantId),
            eq(externalAchievements.studentId, input.studentId)
          )
        )
        .orderBy(desc(externalAchievements.certificateDate));

      // Group by provider
      const grouped = achievements.reduce((acc, achievement) => {
        const provider = achievement.provider;
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider]!.push(achievement);
        return acc;
      }, {} as Record<string, typeof achievements>);

      return grouped;
    }),

  // Get achievements by category
  getByCategory: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const achievements = await ctx.db
        .select()
        .from(externalAchievements)
        .where(
          and(
            eq(externalAchievements.tenantId, ctx.tenantId),
            eq(externalAchievements.studentId, input.studentId)
          )
        )
        .orderBy(desc(externalAchievements.certificateDate));

      // Group by category
      const grouped = achievements.reduce((acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category]!.push(achievement);
        return acc;
      }, {} as Record<string, typeof achievements>);

      return grouped;
    }),

  // Get achievement statistics for dashboard
  getStats: guardianProcedure.query(async ({ ctx }) => {
    const allAchievements = await ctx.db
      .select()
      .from(externalAchievements)
      .where(eq(externalAchievements.tenantId, ctx.tenantId));

    const stats = {
      totalAchievements: allAchievements.length,
      categories: [...new Set(allAchievements.map(a => a.category))],
      providers: [...new Set(allAchievements.map(a => a.provider))],
      recentAchievements: allAchievements
        .sort((a, b) => new Date(b.certificateDate).getTime() - new Date(a.certificateDate).getTime())
        .slice(0, 5),
    };

    return stats;
  }),
});
