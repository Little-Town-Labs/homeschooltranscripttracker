import { eq, and, desc, count, sql } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
} from "@/server/api/trpc";
import {
  students,
  courses,
  grades,
  testScores,
  externalAchievements,
  tenants,
  type Grade
} from "@/server/db/schema";

export const dashboardRouter = createTRPCRouter({
  // Get comprehensive dashboard overview
  getOverview: guardianProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new Error("Missing tenantId in context");
    }
    try {
      // Get basic counts
      const studentCount = await ctx.db
        .select({ count: count() })
        .from(students)
        .where(eq(students.tenantId, ctx.tenantId));

      const courseCount = await ctx.db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.tenantId, ctx.tenantId));

      const gradeCount = await ctx.db
        .select({ count: count() })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(eq(courses.tenantId, ctx.tenantId));

      const testScoreCount = await ctx.db
        .select({ count: count() })
        .from(testScores)
        .where(eq(testScores.tenantId, ctx.tenantId));

      const achievementCount = await ctx.db
        .select({ count: count() })
        .from(externalAchievements)
        .where(eq(externalAchievements.tenantId, ctx.tenantId));

      // Get recent activity
      const recentGrades = await ctx.db
        .select({
          grade: grades,
          course: courses,
          student: students,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .innerJoin(students, eq(courses.studentId, students.id))
        .where(eq(courses.tenantId, ctx.tenantId))
        .orderBy(desc(grades.updatedAt))
        .limit(5);

      const recentTestScores = await ctx.db
        .select({
          testScore: testScores,
          student: students,
        })
        .from(testScores)
        .innerJoin(students, eq(testScores.studentId, students.id))
        .where(eq(testScores.tenantId, ctx.tenantId))
        .orderBy(desc(testScores.createdAt))
        .limit(3);

      return {
        stats: {
          students: studentCount[0]?.count ?? 0,
          courses: courseCount[0]?.count ?? 0,
          grades: gradeCount[0]?.count ?? 0,
          testScores: testScoreCount[0]?.count ?? 0,
          achievements: achievementCount[0]?.count ?? 0,
        },
        recentActivity: {
          grades: recentGrades,
          testScores: recentTestScores,
        },
      };
    } catch (err) {
      throw new Error("Failed to fetch dashboard overview");
    }
  }),

  // Get student progress analytics
  getStudentProgress: guardianProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new Error("Missing tenantId in context");
    }
    try {
      const allStudents = await ctx.db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          graduationYear: students.graduationYear,
          gpaScale: students.gpaScale,
        })
        .from(students)
        .where(eq(students.tenantId, ctx.tenantId));

      // Batch-fetch all courses with grades for the tenant (single query)
      const allCoursesWithGrades = await ctx.db
        .select({
          course: courses,
          grade: grades,
        })
        .from(courses)
        .leftJoin(grades, eq(courses.id, grades.courseId))
        .where(eq(courses.tenantId, ctx.tenantId));

      // Batch-fetch all achievement counts per student (single query)
      const achievementCounts = await ctx.db
        .select({
          studentId: externalAchievements.studentId,
          count: count(),
        })
        .from(externalAchievements)
        .where(eq(externalAchievements.tenantId, ctx.tenantId))
        .groupBy(externalAchievements.studentId);

      const achievementsByStudent = achievementCounts.reduce((acc, row) => {
        acc[row.studentId] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Group courses by student
      const coursesByStudent = allCoursesWithGrades.reduce((acc, item) => {
        const arr = acc[item.course.studentId] ??= [];
        arr.push(item);
        return acc;
      }, {} as Record<string, typeof allCoursesWithGrades>);

      return allStudents.map((student) => {
        const coursesWithGrades = coursesByStudent[student.id] ?? [];

        // Calculate metrics
        const totalCourses = coursesWithGrades.length;
        const completedCourses = coursesWithGrades.filter(item => item.grade).length;
        const totalCredits = coursesWithGrades.reduce((sum, item) => sum + Number(item.course.creditHours), 0);
        const completedCredits = coursesWithGrades
          .filter(item => item.grade)
          .reduce((sum, item) => sum + Number(item.course.creditHours), 0);

        // Calculate GPA
        const gradeData = coursesWithGrades.filter(item => item.grade);
        let gpa = 0;
        if (gradeData.length > 0) {
          const totalQualityPoints = gradeData.reduce(
            (sum, item) => sum + (Number(item.grade?.gpaPoints) * Number(item.course.creditHours)),
            0
          );
          const gradeCredits = gradeData.reduce(
            (sum, item) => sum + Number(item.course.creditHours),
            0
          );
          gpa = gradeCredits > 0 ? totalQualityPoints / gradeCredits : 0;
        }

        // Get graduation requirements progress
        const subjectCredits = coursesWithGrades
          .filter(item => item.grade)
          .reduce((acc, item) => {
            const subject = item.course.subject;
            const credits = Number(item.course.creditHours);
            acc[subject] ??= 0;
            acc[subject] += credits;
            return acc;
          }, {} as Record<string, number>);

        const requirements = {
          english: { required: 4, earned: subjectCredits.English ?? 0 },
          math: { required: 4, earned: subjectCredits.Mathematics ?? 0 },
          science: { required: 3, earned: subjectCredits.Science ?? 0 },
          socialStudies: { required: 3, earned: subjectCredits["Social Studies"] ?? 0 },
          foreignLanguage: { required: 2, earned: subjectCredits["Foreign Language"] ?? 0 },
          fineArts: { required: 1, earned: subjectCredits["Fine Arts"] ?? 0 },
          physicalEducation: { required: 1, earned: subjectCredits["Physical Education"] ?? 0 },
          electives: { required: 6, earned: Math.max(0, completedCredits -
            (subjectCredits.English ?? 0) -
            (subjectCredits.Mathematics ?? 0) -
            (subjectCredits.Science ?? 0) -
            (subjectCredits["Social Studies"] ?? 0) -
            (subjectCredits["Foreign Language"] ?? 0) -
            (subjectCredits["Fine Arts"] ?? 0) -
            (subjectCredits["Physical Education"] ?? 0)) },
        };

        const totalRequired = Object.values(requirements).reduce((sum, req) => sum + req.required, 0);
        const totalEarned = Object.values(requirements).reduce((sum, req) => sum + req.earned, 0);
        const graduationProgress = totalRequired > 0 ? (totalEarned / totalRequired) * 100 : 0;

        return {
          student: {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            graduationYear: student.graduationYear,
            gpaScale: student.gpaScale,
          },
          academics: {
            gpa: Math.round(gpa * 100) / 100,
            totalCourses,
            completedCourses,
            totalCredits,
            completedCredits,
            completionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
            achievements: achievementsByStudent[student.id] ?? 0,
          },
          graduation: {
            progress: Math.min(100, graduationProgress),
            requirements,
            meetsRequirements: graduationProgress >= 100,
            creditsRemaining: Math.max(0, totalRequired - totalEarned),
          },
        };
      });
    } catch (err) {
      throw new Error("Failed to fetch student progress");
    }
  }),

  // Get academic trends and analytics
  getAcademicTrends: guardianProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new Error("Missing tenantId in context");
    }
    try {
      // Get grades by academic year for trend analysis
      const gradesByYear = await ctx.db
        .select({
          academicYear: courses.academicYear,
          letterGrade: grades.grade,
          gpaPoints: grades.gpaPoints,
          creditHours: courses.creditHours,
          subject: courses.subject,
          studentId: courses.studentId,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(eq(courses.tenantId, ctx.tenantId))
        .orderBy(courses.academicYear);

      // Calculate GPA trends by year
      const gpaByYear: Record<string, { gpa: number; credits: number; students: Set<string> }> = {};
      gradesByYear.forEach(item => {
        const year = item.academicYear;
        gpaByYear[year] ??= { gpa: 0, credits: 0, students: new Set() };
        gpaByYear[year].credits += Number(item.creditHours);
        gpaByYear[year].students.add(item.studentId);
      });

      // Calculate actual GPA for each year
      Object.entries(gpaByYear).forEach(([year, data]) => {
        const yearGrades = gradesByYear.filter(item => item.academicYear === year);
        const totalQualityPoints = yearGrades.reduce(
          (sum, item) => sum + (Number(item.gpaPoints) * Number(item.creditHours)),
          0
        );
        const totalCredits = yearGrades.reduce(
          (sum, item) => sum + Number(item.creditHours),
          0
        );
        data.gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
      });

      // Grade distribution analysis
      const gradeDistribution = gradesByYear.reduce((acc, item) => {
        const grade = item.letterGrade;
        acc[grade] ??= 0;
        acc[grade]++;
        return acc;
      }, {} as Record<string, number>);

      // Subject performance analysis
      const subjectPerformance = gradesByYear.reduce((acc, item) => {
        const subject = item.subject;
        acc[subject] ??= { totalGrades: 0, totalPoints: 0, totalCredits: 0 };
        acc[subject].totalGrades += 1;
        acc[subject].totalPoints += Number(item.gpaPoints) * Number(item.creditHours);
        acc[subject].totalCredits += Number(item.creditHours);
        return acc;
      }, {} as Record<string, { totalGrades: number; totalPoints: number; totalCredits: number }>);

      // Calculate average GPA by subject
      Object.entries(subjectPerformance).forEach(([subject, data]) => {
        (subjectPerformance[subject] as { totalGrades: number; totalPoints: number; totalCredits: number; averageGPA?: number }).averageGPA = 
          data.totalCredits > 0 ? data.totalPoints / data.totalCredits : 0;
      });

      return {
        gpaByYear: Object.entries(gpaByYear)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, data]) => ({
            year,
            gpa: Math.round(data.gpa * 100) / 100,
            credits: data.credits,
            studentCount: data.students.size,
          })),
        gradeDistribution,
        subjectPerformance: Object.entries(subjectPerformance)
          .map(([subject, data]) => ({
            subject,
            courseCount: data.totalGrades,
            averageGPA: Math.round((data as { averageGPA?: number }).averageGPA! * 100) / 100,
            totalCredits: data.totalCredits,
          }))
          .sort((a, b) => b.averageGPA - a.averageGPA),
      };
    } catch (err) {
      throw new Error("Failed to fetch academic trends");
    }
  }),

  // Get upcoming tasks and alerts
  getUpcomingTasks: guardianProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new Error("Missing tenantId in context");
    }
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Determine current academic year (September-August)
      const currentAcademicYear = currentMonth >= 8 ? 
        `${currentYear}-${currentYear + 1}` : 
        `${currentYear - 1}-${currentYear}`;

      // Get students and their course progress
      const studentsData = await ctx.db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          graduationYear: students.graduationYear,
        })
        .from(students)
        .where(eq(students.tenantId, ctx.tenantId));

      // Batch-fetch all courses without grades for the tenant (single query)
      const allCoursesWithoutGrades = await ctx.db
        .select({
          id: courses.id,
          studentId: courses.studentId,
          courseName: courses.name,
          academicYear: courses.academicYear,
        })
        .from(courses)
        .leftJoin(grades, eq(courses.id, grades.courseId))
        .where(
          and(
            eq(courses.tenantId, ctx.tenantId),
            sql`${grades.id} IS NULL`
          )
        );

      // Batch-fetch completed course counts per student (single query)
      const completedCourseCounts = await ctx.db
        .select({
          studentId: courses.studentId,
          count: count(),
        })
        .from(courses)
        .innerJoin(grades, eq(courses.id, grades.courseId))
        .where(eq(courses.tenantId, ctx.tenantId))
        .groupBy(courses.studentId);

      const completedByStudent = completedCourseCounts.reduce((acc, row) => {
        acc[row.studentId] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Group missing-grade courses by student
      const missingByStudent = allCoursesWithoutGrades.reduce((acc, course) => {
        const arr = acc[course.studentId] ??= [];
        arr.push(course);
        return acc;
      }, {} as Record<string, typeof allCoursesWithoutGrades>);

      const tasks: Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        studentId: string;
        studentName: string;
        courseId: string | null;
        dueDate: Date | null;
      }> = [];

      for (const student of studentsData) {
        const studentName = `${student.firstName} ${student.lastName}`;

        // Missing grades
        const missingGradeCourses = missingByStudent[student.id] ?? [];
        for (const course of missingGradeCourses) {
          tasks.push({
            type: "missing_grade",
            priority: "medium",
            title: `Missing grade for ${course.courseName}`,
            description: `${studentName} needs a grade recorded`,
            studentId: student.id,
            studentName,
            courseId: course.id,
            dueDate: null,
          });
        }

        // Check graduation requirements for seniors
        if (student.graduationYear === currentYear + 1) {
          tasks.push({
            type: "graduation_check",
            priority: "high",
            title: `Graduation requirements check`,
            description: `Review ${studentName}'s transcript for graduation readiness`,
            studentId: student.id,
            studentName,
            courseId: null,
            dueDate: new Date(currentYear, 4, 1), // May 1st
          });
        }

        // Check for transcript generation
        if ((completedByStudent[student.id] ?? 0) >= 10) {
          tasks.push({
            type: "transcript_ready",
            priority: "low",
            title: `Transcript ready for generation`,
            description: `${studentName} has enough completed courses for transcript`,
            studentId: student.id,
            studentName,
            courseId: null,
            dueDate: null,
          });
        }
      }

      // Sort by priority and date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return tasks
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 0) - 
                   (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 0);
          }
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          return 0;
        })
        .slice(0, 10); // Limit to 10 most important tasks
    } catch (err) {
      throw new Error("Failed to fetch upcoming tasks");
    }
  }),
});