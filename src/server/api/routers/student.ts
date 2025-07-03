import { z } from "zod";
import { eq, and } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
  primaryGuardianProcedure,
} from "@/server/api/trpc";
import { students, gpaScaleEnum } from "@/server/db/schema";

type Student = InferSelectModel<typeof students>;

// Helper function to serialize student data for TRPC responses
const serializeStudent = (student: Student) => ({
  ...student,
  dateOfBirth: student.dateOfBirth ?? null,
});

export const studentRouter = createTRPCRouter({
  // Get all students for the current tenant
  getAll: guardianProcedure.query(async ({ ctx }) => {
    const studentsList = await ctx.db.select().from(students).where(eq(students.tenantId, ctx.tenantId));
    return studentsList.map(serializeStudent);
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

      return serializeStudent(student[0]);
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newStudent] = await ctx.db
        .insert(students)
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ?? null,
          graduationYear: input.graduationYear,
          gpaScale: input.gpaScale,
          tenantId: ctx.tenantId,
        })
        .returning();

      if (!newStudent) {
        throw new Error("Failed to create student");
      }

      return serializeStudent(newStudent);
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const [updatedStudent] = await ctx.db
        .update(students)
        .set(updateData)
        .where(and(eq(students.id, id), eq(students.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedStudent) {
        throw new Error("Student not found or access denied");
      }

      return serializeStudent(updatedStudent);
    }),

  // Delete a student (remove from database)
  delete: primaryGuardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedStudent] = await ctx.db
        .delete(students)
        .where(and(eq(students.id, input.id), eq(students.tenantId, ctx.tenantId)))
        .returning();

      if (!deletedStudent) {
        throw new Error("Student not found or access denied");
      }

      return serializeStudent(deletedStudent);
    }),

  // Get student count for dashboard
  getCount: guardianProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: students.id })
      .from(students)
      .where(eq(students.tenantId, ctx.tenantId));

    return result.length;
  }),
});