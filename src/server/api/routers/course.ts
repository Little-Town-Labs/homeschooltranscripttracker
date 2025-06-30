import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { courses, courseLevelEnum } from "@/server/db/schema";

export const courseRouter = createTRPCRouter({
  // Get all courses for the current tenant
  getAll: guardianProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(courses).where(eq(courses.tenantId, ctx.tenantId));
  }),

  // Get courses by student ID
  getByStudent: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            eq(courses.studentId, input.studentId)
          )
        );
    }),

  // Get a specific course by ID
  getById: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db
        .select()
        .from(courses)
        .where(and(eq(courses.id, input.id), eq(courses.tenantId, ctx.tenantId)))
        .limit(1);

      if (!course[0]) {
        throw new Error("Course not found");
      }

      return course[0];
    }),

  // Create a new course
  create: guardianProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        courseName: z.string().min(1, "Course name is required"),
        subject: z.string().min(1, "Subject is required"),
        level: z.enum(courseLevelEnum.enumValues).default("Regular"),
        credits: z.number().min(0).max(10).default(1),
        academicYear: z.string().min(1, "Academic year is required"),
        semester: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newCourse] = await ctx.db
        .insert(courses)
        .values({
          ...input,
          tenantId: ctx.tenantId,
        })
        .returning();

      return newCourse;
    }),

  // Update a course
  update: guardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        courseName: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        level: z.enum(courseLevelEnum.enumValues).optional(),
        credits: z.number().min(0).max(10).optional(),
        academicYear: z.string().min(1).optional(),
        semester: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const [updatedCourse] = await ctx.db
        .update(courses)
        .set(updateData)
        .where(and(eq(courses.id, id), eq(courses.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedCourse) {
        throw new Error("Course not found or access denied");
      }

      return updatedCourse;
    }),

  // Soft delete a course (set isActive to false)
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedCourse] = await ctx.db
        .update(courses)
        .set({ isActive: false })
        .where(and(eq(courses.id, input.id), eq(courses.tenantId, ctx.tenantId)))
        .returning();

      if (!deletedCourse) {
        throw new Error("Course not found or access denied");
      }

      return deletedCourse;
    }),

  // Get course count for dashboard
  getCount: guardianProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: courses.id })
      .from(courses)
      .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.isActive, true)));

    return result.length;
  }),

  // Get courses grouped by academic year
  getByAcademicYear: guardianProcedure.query(async ({ ctx }) => {
    const allCourses = await ctx.db
      .select()
      .from(courses)
      .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.isActive, true)));

    // Group courses by academic year
    const coursesByYear = allCourses.reduce((acc, course) => {
      acc[course.academicYear] ??= [];
      acc[course.academicYear].push(course);
      return acc;
    }, {} as Record<string, typeof allCourses>);

    return coursesByYear;
  }),
});