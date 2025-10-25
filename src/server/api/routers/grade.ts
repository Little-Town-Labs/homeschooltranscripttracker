import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { grades, courses, students, gradeEnum } from "@/server/db/schema";
import type { Grade, NewGrade, GradeValue, GpaCalculation } from "@/types/core/domain-types";

export const gradeRouter = createTRPCRouter({
  // Get all grades for a specific student
  getByStudent: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          grade: grades,
          course: courses,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            eq(courses.studentId, input.studentId)
          )
        )
        .orderBy(courses.academicYear, courses.name);
    }),

  // Get all grades for a specific course
  getByCourse: guardianProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            eq(grades.courseId, input.courseId)
          )
        );
    }),

  // Create or update a grade for a course
  upsert: guardianProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        letterGrade: z.enum(gradeEnum.enumValues),
        gpaPoints: z.number().min(0).max(5),
        semester: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if grade already exists
      const existingGrade = await ctx.db
        .select({
          id: grades.id,
          courseId: grades.courseId,
          semester: grades.semester,
          grade: grades.grade,
          gpaPoints: grades.gpaPoints,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            eq(grades.courseId, input.courseId),
            input.semester ? eq(grades.semester, input.semester) : eq(grades.semester, "Full Year")
          )
        )
        .limit(1);

      if (existingGrade[0]) {
        // Update existing grade
        const [updatedGrade] = await ctx.db
          .update(grades)
          .set({
            grade: input.letterGrade,
            gpaPoints: String(input.gpaPoints),
          })
          .where(eq(grades.id, existingGrade[0].id))
          .returning();

        return updatedGrade;
      } else {
        // Create new grade
        const [newGrade] = await ctx.db
          .insert(grades)
          .values({
            courseId: input.courseId,
            semester: input.semester ?? "Full Year",
            grade: input.letterGrade,
            gpaPoints: String(input.gpaPoints),
            percentage: null,
            createdBy: ctx.session?.user?.id ?? null,
          })
          .returning();

        return newGrade;
      }
    }),

  // Delete a grade
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the grade belongs to this tenant
      const gradeToDelete = await ctx.db
        .select()
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(grades.id, input.id), eq(courses.tenantId, ctx.tenantId)))
        .limit(1);
      
      if (!gradeToDelete[0]) {
        throw new Error("Grade not found");
      }

      const [deletedGrade] = await ctx.db
        .delete(grades)
        .where(eq(grades.id, input.id))
        .returning();

      if (!deletedGrade) {
        throw new Error("Grade not found or access denied");
      }

      return deletedGrade;
    }),

  // Calculate GPA for a student
  calculateGPA: guardianProcedure
    .input(z.object({ 
      studentId: z.string().uuid(),
      academicYear: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Get student's GPA scale
      const studentResult = await ctx.db
        .select({ gpaScale: students.gpaScale })
        .from(students)
        .where(and(eq(students.id, input.studentId), eq(students.tenantId, ctx.tenantId)))
        .limit(1);
      
      const student = studentResult[0];

      if (!student) {
        throw new Error("Student not found");
      }

      // Build query conditions
      const conditions = [
        eq(courses.tenantId, ctx.tenantId),
        eq(courses.studentId, input.studentId),
      ];

      if (input.academicYear) {
        conditions.push(eq(courses.academicYear, input.academicYear));
      }

      // Get all grades with course credits
      const gradeData = await ctx.db
        .select({
          gpaPoints: grades.gpaPoints,
          credits: courses.creditHours,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(...conditions));

      if (gradeData.length === 0) {
        return {
          gpa: 0,
          totalCredits: 0,
          totalQualityPoints: 0,
          courseCount: 0,
          gpaScale: student.gpaScale,
        };
      }

      // Calculate GPA
      const totalQualityPoints = gradeData.reduce(
        (sum, grade) => sum + (Number(grade.gpaPoints) * Number(grade.credits)), 
        0
      );
      const totalCredits = gradeData.reduce(
        (sum, grade) => sum + Number(grade.credits), 
        0
      );

      const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

      return {
        gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
        totalCredits,
        totalQualityPoints,
        courseCount: gradeData.length,
        gpaScale: student.gpaScale,
      };
    }),

  // Get GPA summary for all students
  getGPASummary: guardianProcedure.query(async ({ ctx }) => {
    const allStudents = await ctx.db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        gpaScale: students.gpaScale,
      })
      .from(students)
      .where(eq(students.tenantId, ctx.tenantId));

    const summary = [];

    for (const student of allStudents) {
      // Get grades for this student
      const gradeData = await ctx.db
        .select({
          gpaPoints: grades.gpaPoints,
          credits: courses.creditHours,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            eq(courses.studentId, student.id)
          )
        );

      let gpa = 0;
      let totalCredits = 0;

      if (gradeData.length > 0) {
        const totalQualityPoints = gradeData.reduce(
          (sum, grade) => sum + (Number(grade.gpaPoints) * Number(grade.credits)), 
          0
        );
        totalCredits = gradeData.reduce(
          (sum, grade) => sum + Number(grade.credits), 
          0
        );
        gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
      }

      summary.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        gpa: Math.round(gpa * 100) / 100,
        totalCredits,
        courseCount: gradeData.length,
        gpaScale: student.gpaScale,
      });
    }

    return summary;
  }),

  // Helper function to convert letter grade to points based on scale
  getGradePoints: guardianProcedure
    .input(z.object({ 
      letterGrade: z.enum(gradeEnum.enumValues),
      gpaScale: z.enum(["4.0", "5.0"]),
      isHonorsOrAP: z.boolean().default(false),
    }))
    .query(({ input }) => {
      const { letterGrade, gpaScale, isHonorsOrAP } = input;
      
      // Base points for 4.0 scale
      const basePoints: Record<GradeValue, number> = {
        'A': 4.0,
        'B': 3.0,
        'C': 2.0,
        'D': 1.0,
        'F': 0.0,
      };

      let points = basePoints[letterGrade];

      // Apply scale and honors/AP boost
      if (gpaScale === "5.0") {
        if (isHonorsOrAP && letterGrade !== 'F') {
          points += 1.0; // Add 1 point for honors/AP on 5.0 scale
        }
      }

      return Math.min(points, parseFloat(gpaScale)); // Cap at scale maximum
    }),
});