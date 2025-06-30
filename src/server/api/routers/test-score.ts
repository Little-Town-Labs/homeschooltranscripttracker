import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { testScores, testTypeEnum } from "@/server/db/schema";

export const testScoreRouter = createTRPCRouter({
  // Get all test scores for a specific student
  getByStudent: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(testScores)
        .where(
          and(
            eq(testScores.tenantId, ctx.tenantId),
            eq(testScores.studentId, input.studentId)
          )
        )
        .orderBy(desc(testScores.testDate), testScores.testType);
    }),

  // Get all test scores for the tenant (all students)
  getAll: guardianProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(testScores)
      .where(eq(testScores.tenantId, ctx.tenantId))
      .orderBy(desc(testScores.testDate));
  }),

  // Get a specific test score by ID
  getById: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const testScore = await ctx.db
        .select()
        .from(testScores)
        .where(and(eq(testScores.id, input.id), eq(testScores.tenantId, ctx.tenantId)))
        .limit(1);

      if (!testScore[0]) {
        throw new Error("Test score not found");
      }

      return testScore[0];
    }),

  // Create a new test score
  create: guardianProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        testType: z.enum(testTypeEnum.enumValues),
        testDate: z.string(), // ISO date string
        score: z.number().int().min(0),
        maxScore: z.number().int().min(1).optional(),
        percentile: z.number().min(0).max(100).optional(),
        subscores: z.record(z.string(), z.number()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newTestScore] = await ctx.db
        .insert(testScores)
        .values({
          ...input,
          testDate: new Date(input.testDate),
          tenantId: ctx.tenantId,
        })
        .returning();

      return newTestScore;
    }),

  // Update a test score
  update: guardianProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        testType: z.enum(testTypeEnum.enumValues).optional(),
        testDate: z.string().optional(),
        score: z.number().int().min(0).optional(),
        maxScore: z.number().int().min(1).optional(),
        percentile: z.number().min(0).max(100).optional(),
        subscores: z.record(z.string(), z.number()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // Convert date string to Date if provided
      const processedData = {
        ...updateData,
        testDate: updateData.testDate ? new Date(updateData.testDate) : undefined,
      };

      const [updatedTestScore] = await ctx.db
        .update(testScores)
        .set(processedData)
        .where(and(eq(testScores.id, id), eq(testScores.tenantId, ctx.tenantId)))
        .returning();

      if (!updatedTestScore) {
        throw new Error("Test score not found or access denied");
      }

      return updatedTestScore;
    }),

  // Delete a test score
  delete: guardianProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedTestScore] = await ctx.db
        .delete(testScores)
        .where(and(eq(testScores.id, input.id), eq(testScores.tenantId, ctx.tenantId)))
        .returning();

      if (!deletedTestScore) {
        throw new Error("Test score not found or access denied");
      }

      return deletedTestScore;
    }),

  // Get best scores for a student (highest score per test type)
  getBestScores: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all test scores for the student
      const allScores = await ctx.db
        .select()
        .from(testScores)
        .where(
          and(
            eq(testScores.tenantId, ctx.tenantId),
            eq(testScores.studentId, input.studentId)
          )
        );

      // Group by test type and find the highest score for each
      const bestScores = allScores.reduce((acc, score) => {
        const existing = acc.find(s => s.testType === score.testType);
        if (!existing || score.score > existing.score) {
          // Remove existing score of this type if found
          const filtered = acc.filter(s => s.testType !== score.testType);
          filtered.push(score);
          return filtered;
        }
        return acc;
      }, [] as typeof allScores);

      return bestScores.sort((a, b) => a.testType.localeCompare(b.testType));
    }),

  // Get test score statistics for dashboard
  getStats: guardianProcedure.query(async ({ ctx }) => {
    const allScores = await ctx.db
      .select()
      .from(testScores)
      .where(eq(testScores.tenantId, ctx.tenantId));

    const stats = {
      totalTests: allScores.length,
      testTypes: [...new Set(allScores.map(s => s.testType))],
      recentTests: allScores
        .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
        .slice(0, 5),
    };

    return stats;
  }),

  // Get test score ranges and info for validation
  getTestInfo: guardianProcedure
    .input(z.object({ testType: z.enum(testTypeEnum.enumValues) }))
    .query(({ input }) => {
      const testInfo = {
        SAT: {
          minScore: 400,
          maxScore: 1600,
          sections: ['Evidence-Based Reading and Writing', 'Math'],
          sectionMinMax: { min: 200, max: 800 },
          description: 'SAT Total Score (400-1600)',
        },
        ACT: {
          minScore: 1,
          maxScore: 36,
          sections: ['English', 'Math', 'Reading', 'Science'],
          sectionMinMax: { min: 1, max: 36 },
          description: 'ACT Composite Score (1-36)',
        },
        PSAT: {
          minScore: 320,
          maxScore: 1520,
          sections: ['Evidence-Based Reading and Writing', 'Math'],
          sectionMinMax: { min: 160, max: 760 },
          description: 'PSAT Total Score (320-1520)',
        },
        AP: {
          minScore: 1,
          maxScore: 5,
          sections: [],
          sectionMinMax: { min: 1, max: 5 },
          description: 'AP Exam Score (1-5)',
        },
        CLEP: {
          minScore: 20,
          maxScore: 80,
          sections: [],
          sectionMinMax: { min: 20, max: 80 },
          description: 'CLEP Score (20-80)',
        },
        'SAT Subject': {
          minScore: 200,
          maxScore: 800,
          sections: [],
          sectionMinMax: { min: 200, max: 800 },
          description: 'SAT Subject Test Score (200-800)',
        },
        'State Assessment': {
          minScore: 0,
          maxScore: 1000,
          sections: [],
          sectionMinMax: { min: 0, max: 1000 },
          description: 'State Assessment Score (varies by state)',
        },
        Other: {
          minScore: 0,
          maxScore: 1000,
          sections: [],
          sectionMinMax: { min: 0, max: 1000 },
          description: 'Custom Test Score',
        },
      };

      return testInfo[input.testType];
    }),
});