import { z } from "zod";
import { eq, and, desc, asc } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import { 
  students, 
  courses, 
  grades, 
  testScores,
  tenants,
  type Grade 
} from "@/server/db/schema";

export const transcriptRouter = createTRPCRouter({
  // Get complete transcript data for a student
  getTranscriptData: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get student information
      const studentResult = await ctx.db
        .select()
        .from(students)
        .where(and(eq(students.id, input.studentId), eq(students.tenantId, ctx.tenantId)))
        .limit(1);

      const student = studentResult[0];
      if (!student) {
        throw new Error("Student not found");
      }

      // Get tenant information for school details
      const tenantResult = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      const tenant = tenantResult[0];

      // Get all courses with grades for this student
      const coursesWithGrades = await ctx.db
        .select({
          course: courses,
          grade: grades,
        })
        .from(courses)
        .leftJoin(grades, eq(courses.id, grades.courseId))
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)))
        .orderBy(asc(courses.academicYear), asc(courses.courseName));

      // Get test scores
      const studentTestScores = await ctx.db
        .select()
        .from(testScores)
        .where(and(eq(testScores.studentId, input.studentId), eq(testScores.tenantId, ctx.tenantId)))
        .orderBy(desc(testScores.testDate));

      // Calculate cumulative GPA
      const gpaData = await ctx.db
        .select({
          gradePoints: grades.gradePoints,
          credits: courses.credits,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(grades.tenantId, ctx.tenantId), eq(courses.studentId, input.studentId)));

      let cumulativeGPA = 0;
      let totalCredits = 0;
      let totalQualityPoints = 0;

      if (gpaData.length > 0) {
        totalQualityPoints = gpaData.reduce(
          (sum, grade) => sum + (Number(grade.gradePoints) * Number(grade.credits)),
          0
        );
        totalCredits = gpaData.reduce(
          (sum, grade) => sum + Number(grade.credits),
          0
        );
        cumulativeGPA = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
      }

      // Group courses by academic year
      const coursesByYear: Record<string, typeof coursesWithGrades> = {};
      coursesWithGrades.forEach(item => {
        const year = item.course.academicYear;
        if (!coursesByYear[year]) {
          coursesByYear[year] = [];
        }
        coursesByYear[year]!.push(item);
      });

      // Calculate GPA by year
      const gpaByYear: Record<string, { gpa: number; credits: number }> = {};
      Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
        const yearGpaData = yearCourses.filter(item => item.grade);
        if (yearGpaData.length > 0) {
          const yearQualityPoints = yearGpaData.reduce(
            (sum, item) => sum + (Number(item.grade?.gradePoints) * Number(item.course.credits)),
            0
          );
          const yearCredits = yearGpaData.reduce(
            (sum, item) => sum + Number(item.course.credits),
            0
          );
          gpaByYear[year] = {
            gpa: yearCredits > 0 ? yearQualityPoints / yearCredits : 0,
            credits: yearCredits,
          };
        }
      });

      // Get best test scores per type
      const bestTestScores = studentTestScores.reduce((acc, score) => {
        const existing = acc.find(s => s.testType === score.testType);
        if (!existing || score.score > existing.score) {
          const filtered = acc.filter(s => s.testType !== score.testType);
          filtered.push(score);
          return filtered;
        }
        return acc;
      }, [] as typeof studentTestScores);

      return {
        student,
        tenant,
        coursesByYear,
        gpaByYear,
        cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
        totalCredits,
        totalQualityPoints,
        testScores: bestTestScores.sort((a, b) => a.testType.localeCompare(b.testType)),
        generatedAt: new Date(),
      };
    }),

  // Generate transcript statistics
  getTranscriptStats: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get course count by subject area
      const coursesBySubject = await ctx.db
        .select({
          subject: courses.subject,
          credits: courses.credits,
        })
        .from(courses)
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)));

      const subjectStats = coursesBySubject.reduce((acc, course) => {
        const subject = course.subject;
        if (!acc[subject]) {
          acc[subject] = { courses: 0, credits: 0 };
        }
        acc[subject].courses += 1;
        acc[subject].credits += Number(course.credits);
        return acc;
      }, {} as Record<string, { courses: number; credits: number }>);

      // Get grade distribution
      const gradeDistribution = await ctx.db
        .select({
          letterGrade: grades.letterGrade,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(grades.tenantId, ctx.tenantId), eq(courses.studentId, input.studentId)));

      const gradeStats = gradeDistribution.reduce((acc, grade) => {
        const letter = grade.letterGrade;
        acc[letter] = (acc[letter] ?? 0) + 1;
        return acc;
      }, {} as Record<Grade, number>);

      return {
        subjectStats,
        gradeStats,
        totalCourses: coursesBySubject.length,
        totalCredits: coursesBySubject.reduce((sum, course) => sum + Number(course.credits), 0),
      };
    }),

  // Get transcript formatting options
  getTranscriptFormats: guardianProcedure.query(() => {
    return {
      templates: [
        {
          id: "standard",
          name: "Standard Format",
          description: "Traditional high school transcript layout",
          preview: "/images/transcript-standard.png",
        },
        {
          id: "detailed",
          name: "Detailed Format", 
          description: "Comprehensive format with course descriptions",
          preview: "/images/transcript-detailed.png",
        },
        {
          id: "college-prep",
          name: "College Prep Format",
          description: "Optimized for college admissions",
          preview: "/images/transcript-college-prep.png",
        },
      ],
      options: {
        includeTestScores: true,
        includeClassRank: false,
        includeHonorsDesignation: true,
        includeGpaScale: true,
        includeSignature: true,
        watermark: false, // Will be true for trial users
      },
    };
  }),

  // Validate transcript generation eligibility
  validateTranscriptGeneration: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user has active subscription (placeholder for now)
      const hasActiveSubscription = true; // TODO: Implement subscription check

      // Get student courses count
      const coursesCount = await ctx.db
        .select({ count: courses.id })
        .from(courses)
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)));

      const issues = [];
      
      if (coursesCount.length === 0) {
        issues.push("No courses found for this student");
      }

      // Check for minimum graduation requirements (placeholder)
      if (coursesCount.length < 20) {
        issues.push("Minimum 20 credits typically required for graduation");
      }

      return {
        canGenerate: issues.length === 0,
        hasActiveSubscription,
        issues,
        requiresSubscription: !hasActiveSubscription,
        coursesCount: coursesCount.length,
      };
    }),

  // Get graduation requirements analysis
  getGraduationRequirements: guardianProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get courses by subject
      const coursesBySubject = await ctx.db
        .select({
          subject: courses.subject,
          credits: courses.credits,
          level: courses.level,
        })
        .from(courses)
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)));

      // Define standard graduation requirements
      const requirements = {
        "English": { required: 4, earned: 0 },
        "Mathematics": { required: 4, earned: 0 },
        "Science": { required: 3, earned: 0 },
        "Social Studies": { required: 3, earned: 0 },
        "Foreign Language": { required: 2, earned: 0 },
        "Fine Arts": { required: 1, earned: 0 },
        "Physical Education": { required: 1, earned: 0 },
        "Electives": { required: 6, earned: 0 },
      };

      // Calculate earned credits by subject
      coursesBySubject.forEach(course => {
        const subject = course.subject;
        const credits = Number(course.credits);
        
        if (requirements[subject]) {
          requirements[subject].earned += credits;
        } else {
          requirements["Electives"].earned += credits;
        }
      });

      const totalRequired = Object.values(requirements).reduce((sum, req) => sum + req.required, 0);
      const totalEarned = Object.values(requirements).reduce((sum, req) => sum + req.earned, 0);

      return {
        requirements,
        summary: {
          totalRequired,
          totalEarned,
          meetsRequirements: totalEarned >= totalRequired,
          creditsRemaining: Math.max(0, totalRequired - totalEarned),
        },
      };
    }),
});