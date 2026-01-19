import { z } from "zod";
import { eq, and, desc, isNull } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import {
  studentActivities,
  activityCategoryEnum,
} from "@/server/db/schema";

export const studentActivityRouter = createTRPCRouter({
  // Get all activities for a student
  getByStudent: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db
        .select()
        .from(studentActivities)
        .where(
          and(
            eq(studentActivities.studentId, input.studentId),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        )
        .orderBy(desc(studentActivities.startDate));

      return activities;
    }),

  // Get all activities in tenant
  getAll: guardianProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(studentActivities)
      .where(eq(studentActivities.tenantId, ctx.tenantId))
      .orderBy(desc(studentActivities.startDate));
  }),

  // Get single activity by ID
  getById: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(studentActivities)
        .where(
          and(
            eq(studentActivities.id, input.id),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        )
        .limit(1);

      return results[0] ?? null;
    }),

  // Create new activity
  create: guardianProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        activityName: z.string().min(1, "Activity name is required"),
        category: z.enum(activityCategoryEnum.enumValues),
        organization: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional().or(z.literal("")),
        role: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [activity] = await ctx.db
        .insert(studentActivities)
        .values({
          tenantId: ctx.tenantId,
          studentId: input.studentId,
          activityName: input.activityName,
          category: input.category,
          organization: input.organization ?? null,
          startDate: input.startDate,
          endDate: input.endDate || null,
          role: input.role ?? null,
          metadata: input.metadata ?? null,
          description: input.description ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      return activity;
    }),

  // Update activity
  update: guardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        activityName: z.string().min(1).optional(),
        category: z.enum(activityCategoryEnum.enumValues).optional(),
        organization: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional().or(z.literal("")),
        role: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(studentActivities)
        .set({
          ...updateData,
          endDate: input.endDate === "" ? null : input.endDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(studentActivities.id, id),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        )
        .returning();

      return updated;
    }),

  // Delete activity
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(studentActivities)
        .where(
          and(
            eq(studentActivities.id, input.id),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        );

      return { success: true };
    }),

  // Group by category
  getByCategory: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db
        .select()
        .from(studentActivities)
        .where(
          and(
            eq(studentActivities.studentId, input.studentId),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        )
        .orderBy(desc(studentActivities.startDate));

      return activities.reduce(
        (acc, activity) => {
          const category = activity.category;
          acc[category] ??= [];
          acc[category].push(activity);
          return acc;
        },
        {} as Record<string, typeof activities>
      );
    }),

  // Get ongoing activities
  getOngoing: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(studentActivities)
        .where(
          and(
            eq(studentActivities.studentId, input.studentId),
            eq(studentActivities.tenantId, ctx.tenantId),
            isNull(studentActivities.endDate)
          )
        )
        .orderBy(desc(studentActivities.startDate));
    }),

  // Get activity stats
  getStats: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db
        .select()
        .from(studentActivities)
        .where(
          and(
            eq(studentActivities.studentId, input.studentId),
            eq(studentActivities.tenantId, ctx.tenantId)
          )
        );

      const ongoing = activities.filter((a) => !a.endDate).length;
      const categories = [...new Set(activities.map((a) => a.category))];

      return {
        total: activities.length,
        ongoing,
        completed: activities.length - ongoing,
        categories: categories.length,
        recentActivities: activities
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 5),
      };
    }),
});
