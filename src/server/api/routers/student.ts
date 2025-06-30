import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
  primaryGuardianProcedure,
} from "@/server/api/trpc";
import { students, gpaScaleEnum } from "@/server/db/schema";

export const studentRouter = createTRPCRouter({
  // Get all students for the current tenant
  getAll: guardianProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(students).where(eq(students.tenantId, ctx.tenantId));
  }),

  // Get a specific student by ID
  getById: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const student = await ctx.db
        .select()
        .from(students)
        .where(and(eq(students.id, input.id), eq(students.tenantId, ctx.tenantId)))
        .limit(1);

      if (!student[0]) {
        throw new Error("Student not found");
      }

      return student[0];
    }),

  // Create a new student
  create: primaryGuardianProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        dateOfBirth: z.string().optional(),
        graduationYear: z.number().int().min(2020).max(2040),
        gpaScale: z.enum(gpaScaleEnum.enumValues).default("4.0"),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newStudent] = await ctx.db
        .insert(students)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        })
        .returning();

      return newStudent;
    }),

  // Update a student
  update: primaryGuardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        dateOfBirth: z.string().optional(),
        graduationYear: z.number().int().min(2020).max(2040).optional(),
        gpaScale: z.enum(gpaScaleEnum.enumValues).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // Convert dateOfBirth string to Date if provided
      const processedData = {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
      };

      const [updatedStudent] = await ctx.db
        .update(students)
        .set(processedData)
        .where(and(eq(students.id, id), eq(students.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedStudent) {
        throw new Error("Student not found or access denied");
      }

      return updatedStudent;
    }),

  // Soft delete a student (set isActive to false)
  delete: primaryGuardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedStudent] = await ctx.db
        .update(students)
        .set({ isActive: false })
        .where(and(eq(students.id, input.id), eq(students.tenantId, ctx.tenantId)))
        .returning();

      if (!deletedStudent) {
        throw new Error("Student not found or access denied");
      }

      return deletedStudent;
    }),

  // Get student count for dashboard
  getCount: guardianProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: students.id })
      .from(students)
      .where(and(eq(students.tenantId, ctx.tenantId), eq(students.isActive, true)));

    return result.length;
  }),
});