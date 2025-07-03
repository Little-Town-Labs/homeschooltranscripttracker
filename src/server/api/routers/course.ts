import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { courses, courseLevelEnum, subjectEnum } from "@/server/db/schema";

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
        subject: z.enum(subjectEnum.enumValues),
        level: z.enum(courseLevelEnum.enumValues).default("Regular"),
        credits: z.number().min(0).max(10).default(1),
        academicYear: z.string().min(1, "Academic year is required"),
        semester: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Debug logging to see exactly what's happening
      console.log("=== COURSE CREATE DEBUG ===");
      console.log("Raw input:", input);
      console.log("courseName value:", input.courseName);
      console.log("courseName type:", typeof input.courseName);
      console.log("courseName length:", input.courseName?.length);
      
      // Validate that courseName is not empty
      if (!input.courseName || input.courseName.trim() === '') {
        throw new Error("Course name cannot be empty");
      }
      
      const insertData = {
        studentId: input.studentId,
        name: input.courseName.trim(), // Ensure no whitespace issues
        subject: input.subject,
        level: input.level,
        creditHours: input.credits.toString(),
        academicYear: input.academicYear,
        description: input.description ?? null,
        tenantId: ctx.tenantId,
      };
      
      console.log("Insert data:", insertData);
      console.log("=== END DEBUG ===");
      
      const [newCourse] = await ctx.db
        .insert(courses)
        .values(insertData)
        .returning();

      if (!newCourse) {
        throw new Error("Failed to create course");
      }

      return newCourse;
    }),

  // Update a course
  update: guardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        courseName: z.string().min(1).optional(),
        subject: z.enum(subjectEnum.enumValues).optional(),
        level: z.enum(courseLevelEnum.enumValues).optional(),
        credits: z.number().min(0).max(10).optional(),
        academicYear: z.string().min(1).optional(),
        semester: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, courseName, credits, ...updateData } = input;

      const updateValues: Partial<typeof courses.$inferInsert> = { ...updateData };
      if (courseName !== undefined) updateValues.name = courseName;
      if (credits !== undefined) updateValues.creditHours = credits.toString();

      const [updatedCourse] = await ctx.db
        .update(courses)
        .set(updateValues)
        .where(and(eq(courses.id, id), eq(courses.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedCourse) {
        throw new Error("Course not found or access denied");
      }

      return updatedCourse;
    }),

  // Delete a course (hard delete)
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedCourse] = await ctx.db
        .delete(courses)
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
      .where(eq(courses.tenantId, ctx.tenantId));

    return result.length;
  }),

  // Get courses grouped by academic year
  getByAcademicYear: guardianProcedure.query(async ({ ctx }) => {
    const allCourses = await ctx.db
      .select()
      .from(courses)
      .where(eq(courses.tenantId, ctx.tenantId));

    // Group courses by academic year
    const coursesByYear = allCourses.reduce((acc, course) => {
      acc[course.academicYear] ??= [];
      acc[course.academicYear]!.push(course);
      return acc;
    }, {} as Record<string, typeof allCourses>);

    return coursesByYear;
  }),
});