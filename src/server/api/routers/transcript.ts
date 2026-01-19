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
  externalAchievements,
  studentActivities,
  tenants,
  type Grade
} from "@/server/db/schema";



// Helper function to safely get test score values
const getTestScoreValue = (scores: unknown, key: string): number => {
  if (typeof scores === 'object' && scores !== null && key in scores) {
    const value = (scores as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : 0;
  }
  return 0;
};

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
        .orderBy(asc(courses.academicYear), asc(courses.name));

      // Get test scores
      const studentTestScores = await ctx.db
        .select()
        .from(testScores)
        .where(and(eq(testScores.studentId, input.studentId), eq(testScores.tenantId, ctx.tenantId)))
        .orderBy(desc(testScores.testDate));

      // Get external achievements
      const studentAchievements = await ctx.db
        .select()
        .from(externalAchievements)
        .where(and(eq(externalAchievements.studentId, input.studentId), eq(externalAchievements.tenantId, ctx.tenantId)))
        .orderBy(desc(externalAchievements.certificateDate));

      // Get student activities
      const studentActivitiesList = await ctx.db
        .select()
        .from(studentActivities)
        .where(and(eq(studentActivities.studentId, input.studentId), eq(studentActivities.tenantId, ctx.tenantId)))
        .orderBy(desc(studentActivities.startDate));

      // Calculate cumulative GPA
      const gpaData = await ctx.db
        .select({
          gradePoints: grades.gpaPoints,
          credits: courses.creditHours,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.studentId, input.studentId)));

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
        coursesByYear[year] ??= [];
        coursesByYear[year].push(item);
      });

      // Calculate GPA by year
      const gpaByYear: Record<string, { gpa: number; credits: number }> = {};
      Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
        const yearGpaData = yearCourses.filter(item => item.grade);
        if (yearGpaData.length > 0) {
          const yearQualityPoints = yearGpaData.reduce(
            (sum, item) => sum + (Number(item.grade?.gpaPoints) * Number(item.course.creditHours)),
            0
          );
          const yearCredits = yearGpaData.reduce(
            (sum, item) => sum + Number(item.course.creditHours),
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
        const scoreValue = getTestScoreValue(score.scores, 'total');
        const existingValue = existing ? getTestScoreValue(existing.scores, 'total') : 0;
        if (!existing || scoreValue > existingValue) {
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
        achievements: studentAchievements,
        activities: studentActivitiesList,
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
          creditHours: courses.creditHours,
        })
        .from(courses)
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)));

      const subjectStats = coursesBySubject.reduce((acc, course) => {
        const subject = course.subject;
        acc[subject] ??= { courses: 0, credits: 0 };
        acc[subject].courses += 1;
        acc[subject].credits += Number(course.creditHours);
        return acc;
      }, {} as Record<string, { courses: number; credits: number }>);

      // Get grade distribution
      const gradeDistribution = await ctx.db
        .select({
          grade: grades.grade,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.studentId, input.studentId)));

      const gradeStats = gradeDistribution.reduce((acc, grade) => {
        const letter = grade.grade;
        acc[letter] = (acc[letter] ?? 0) + 1;
        return acc;
      }, {} as Record<Grade, number>);

      return {
        subjectStats,
        gradeStats,
        totalCourses: coursesBySubject.length,
        totalCredits: coursesBySubject.reduce((sum, course) => sum + Number(course.creditHours), 0),
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
      const warnings = [];
      
      if (coursesCount.length === 0) {
        issues.push("No courses found for this student");
      }

      // Add informational warnings for partial transcripts
      if (coursesCount.length > 0 && coursesCount.length < 20) {
        warnings.push(`This is a partial transcript with ${coursesCount.length} course${coursesCount.length === 1 ? '' : 's'}. Standard graduation typically requires 20+ credits.`);
      }

      // Determine transcript status
      let transcriptStatus = "complete";
      if (coursesCount.length === 0) {
        transcriptStatus = "empty";
      } else if (coursesCount.length < 20) {
        transcriptStatus = "partial";
      }

      return {
        canGenerate: coursesCount.length > 0, // Can generate if any courses exist
        hasActiveSubscription,
        issues,
        warnings,
        requiresSubscription: !hasActiveSubscription,
        coursesCount: coursesCount.length,
        transcriptStatus,
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
          creditHours: courses.creditHours,
          level: courses.level,
        })
        .from(courses)
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)));

      // Define standard graduation requirements
      const requirements: Record<string, { required: number; earned: number }> = {
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
        const credits = Number(course.creditHours);
        
        if (subject && subject in requirements) {
          requirements[subject]!.earned += credits;
        } else {
          requirements.Electives!.earned += credits;
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

  // Generate PDF transcript (server-side)
  generateTranscriptPdf: guardianProcedure
    .input(z.object({
      studentId: z.string().uuid(),
      format: z.enum(['standard', 'detailed', 'college-prep']).default('standard'),
      includeWatermark: z.boolean().default(false),
      includeAchievements: z.boolean().default(true),
      includeActivities: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get transcript data using the existing query logic
      const studentResult = await ctx.db
        .select()
        .from(students)
        .where(and(eq(students.id, input.studentId), eq(students.tenantId, ctx.tenantId)))
        .limit(1);

      const student = studentResult[0];
      if (!student) {
        throw new Error("Student not found");
      }

      // Get tenant information
      const tenantResult = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      const tenant = tenantResult[0];

      // Get courses with grades
      const coursesWithGrades = await ctx.db
        .select({
          course: courses,
          grade: grades,
        })
        .from(courses)
        .leftJoin(grades, eq(courses.id, grades.courseId))
        .where(and(eq(courses.studentId, input.studentId), eq(courses.tenantId, ctx.tenantId)))
        .orderBy(asc(courses.academicYear), asc(courses.name));

      // Get test scores
      const studentTestScores = await ctx.db
        .select()
        .from(testScores)
        .where(and(eq(testScores.studentId, input.studentId), eq(testScores.tenantId, ctx.tenantId)))
        .orderBy(desc(testScores.testDate));

      // Get external achievements (conditionally)
      const studentAchievements = input.includeAchievements ? await ctx.db
        .select()
        .from(externalAchievements)
        .where(and(eq(externalAchievements.studentId, input.studentId), eq(externalAchievements.tenantId, ctx.tenantId)))
        .orderBy(desc(externalAchievements.certificateDate)) : [];

      // Get student activities (conditionally)
      const studentActivitiesList = input.includeActivities ? await ctx.db
        .select()
        .from(studentActivities)
        .where(and(eq(studentActivities.studentId, input.studentId), eq(studentActivities.tenantId, ctx.tenantId)))
        .orderBy(desc(studentActivities.startDate)) : [];

      // Calculate GPA and credits
      const gpaData = await ctx.db
        .select({
          gradePoints: grades.gpaPoints,
          credits: courses.creditHours,
        })
        .from(grades)
        .innerJoin(courses, eq(grades.courseId, courses.id))
        .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.studentId, input.studentId)));

      let cumulativeGPA = 0;
      let totalCredits = 0;

      if (gpaData.length > 0) {
        const totalQualityPoints = gpaData.reduce(
          (sum, grade) => sum + (Number(grade.gradePoints) * Number(grade.credits)),
          0
        );
        totalCredits = gpaData.reduce(
          (sum, grade) => sum + Number(grade.credits),
          0
        );
        cumulativeGPA = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
      }

      // Group courses by year
      const coursesByYear: Record<string, typeof coursesWithGrades> = {};
      coursesWithGrades.forEach(item => {
        const year = item.course.academicYear;
        coursesByYear[year] ??= [];
        coursesByYear[year].push(item);
      });

      // Calculate GPA by year
      const gpaByYear: Record<string, { gpa: number; credits: number }> = {};
      Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
        const yearGpaData = yearCourses.filter(item => item.grade);
        if (yearGpaData.length > 0) {
          const yearQualityPoints = yearGpaData.reduce(
            (sum, item) => sum + (Number(item.grade?.gpaPoints) * Number(item.course.creditHours)),
            0
          );
          const yearCredits = yearGpaData.reduce(
            (sum, item) => sum + Number(item.course.creditHours),
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
        const scoreValue = getTestScoreValue(score.scores, 'total');
        const existingValue = existing ? getTestScoreValue(existing.scores, 'total') : 0;
        if (!existing || scoreValue > existingValue) {
          const filtered = acc.filter(s => s.testType !== score.testType);
          filtered.push(score);
          return filtered;
        }
        return acc;
      }, [] as typeof studentTestScores);

      const transcriptData = {
        student,
        tenant,
        coursesByYear,
        gpaByYear,
        cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
        totalCredits,
        testScores: bestTestScores.sort((a, b) => a.testType.localeCompare(b.testType)),
        achievements: studentAchievements,
        activities: studentActivitiesList,
      };

      // Generate PDF using React PDF (server-side)
      try {
        const { renderToBuffer } = await import('@react-pdf/renderer');
        const { Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');
        const React = await import('react');

        // Helper function to safely get test score values
        const getTestScoreValue = (scores: unknown, key: string): number | string | undefined => {
          if (typeof scores === 'object' && scores !== null && key in scores) {
            return (scores as Record<string, unknown>)[key] as number | string | undefined;
          }
          return undefined;
        };

        // Helper function to safely format numbers
        const formatNumber = (value: string | number | null): string => {
          if (value === null || value === undefined) return '0';
          return typeof value === 'string' ? value : value.toString();
        };

        // PDF Styles
        const styles = StyleSheet.create({
          page: {
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            paddingTop: 30,
            paddingBottom: 30,
            paddingHorizontal: 30,
            fontFamily: 'Helvetica',
            fontSize: 10,
            lineHeight: 1.4,
          },
          header: {
            marginBottom: 20,
            textAlign: 'center',
            borderBottom: '2pt solid #333333',
            paddingBottom: 10,
          },
          schoolName: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 5,
            color: '#333333',
          },
          documentTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: 10,
            color: '#333333',
          },
          studentInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
            padding: 10,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
          },
          studentDetails: {
            flex: 1,
          },
          academicSummary: {
            flex: 1,
            marginLeft: 20,
          },
          infoLabel: {
            fontSize: 8,
            color: '#666666',
            marginBottom: 2,
          },
          infoValue: {
            fontSize: 10,
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#333333',
          },
          yearSection: {
            marginBottom: 15,
            border: '1pt solid #e0e0e0',
            borderRadius: 4,
          },
          yearHeader: {
            backgroundColor: '#f0f0f0',
            padding: 8,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#333333',
          },
          yearGpa: {
            fontSize: 10,
            color: '#666666',
            marginTop: 4,
          },
          courseTable: {
            marginTop: 8,
          },
          tableHeader: {
            flexDirection: 'row',
            backgroundColor: '#f8f9fa',
            padding: 4,
            borderBottom: '1pt solid #dee2e6',
            fontSize: 8,
            fontWeight: 'bold',
            color: '#495057',
          },
          tableRow: {
            flexDirection: 'row',
            padding: 4,
            borderBottom: '0.5pt solid #dee2e6',
            minHeight: 20,
          },
          tableCell: {
            flex: 1,
            fontSize: 9,
            color: '#333333',
            paddingRight: 4,
          },
          courseName: {
            flex: 3,
          },
          courseSubject: {
            flex: 1,
          },
          courseLevel: {
            flex: 1,
          },
          courseCredits: {
            flex: 1,
            textAlign: 'right',
          },
          courseGrade: {
            flex: 1,
            textAlign: 'center',
            fontWeight: 'bold',
          },
          testScoresSection: {
            marginTop: 20,
            padding: 10,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
          },
          testScoresTitle: {
            fontSize: 12,
            fontWeight: 'bold',
            marginBottom: 10,
            color: '#333333',
          },
          testScoresGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          },
          testScoreCard: {
            backgroundColor: '#ffffff',
            padding: 8,
            borderRadius: 4,
            border: '1pt solid #dee2e6',
            minWidth: 120,
          },
          testType: {
            fontSize: 9,
            fontWeight: 'bold',
            color: '#495057',
            marginBottom: 4,
          },
          testScore: {
            fontSize: 11,
            fontWeight: 'bold',
            color: '#333333',
            marginBottom: 2,
          },
          testDate: {
            fontSize: 8,
            color: '#666666',
            marginBottom: 2,
          },
          testPercentile: {
            fontSize: 8,
            color: '#007bff',
            fontStyle: 'italic',
          },
          achievementsSection: {
            marginTop: 20,
            padding: 10,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
          },
          achievementsTitle: {
            fontSize: 12,
            fontWeight: 'bold',
            marginBottom: 10,
            color: '#333333',
          },
          achievementCategory: {
            marginTop: 8,
            marginBottom: 8,
          },
          achievementCategoryTitle: {
            fontSize: 10,
            fontWeight: 'bold',
            color: '#495057',
            marginBottom: 4,
            borderBottom: '1pt solid #dee2e6',
            paddingBottom: 2,
          },
          achievementTable: {
            marginTop: 4,
          },
          achievementRow: {
            flexDirection: 'row',
            paddingVertical: 4,
            borderBottom: '0.5pt solid #e9ecef',
          },
          achievementTitle: {
            fontSize: 9,
            fontWeight: 'bold',
            color: '#212529',
            width: '35%',
          },
          achievementProvider: {
            fontSize: 9,
            color: '#495057',
            width: '25%',
          },
          achievementDate: {
            fontSize: 8,
            color: '#666666',
            width: '20%',
          },
          achievementScore: {
            fontSize: 9,
            color: '#333333',
            width: '20%',
            textAlign: 'right',
          },
          achievementSkills: {
            fontSize: 7,
            color: '#6c757d',
            fontStyle: 'italic',
            marginTop: 2,
          },
          footer: {
            marginTop: 20,
            paddingTop: 10,
            borderTop: '1pt solid #dee2e6',
            textAlign: 'center',
          },
          footerText: {
            fontSize: 8,
            color: '#666666',
            marginBottom: 4,
          },
          footerContact: {
            fontSize: 8,
            color: '#333333',
          },
          watermark: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: 48,
            color: '#f0f0f0',
            opacity: 0.3,
            zIndex: -1,
          },
        });

        // Create PDF Document
        const MyDocument = React.createElement(Document, {}, 
          React.createElement(Page, { size: 'A4', style: styles.page },
            // Watermark for trial users
            input.includeWatermark && React.createElement(View, { style: styles.watermark },
              React.createElement(Text, {}, 'TRIAL VERSION')
            ),
            
            // Header
            React.createElement(View, { style: styles.header },
              React.createElement(Text, { style: styles.schoolName }, 
                transcriptData.tenant?.name ?? 'Homeschool'
              ),
              React.createElement(Text, { style: styles.documentTitle }, 
                'Official Academic Transcript'
              )
            ),

            // Student Information
            React.createElement(View, { style: styles.studentInfo },
              React.createElement(View, { style: styles.studentDetails },
                React.createElement(Text, { style: styles.infoLabel }, 'Student Name:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  `${transcriptData.student.firstName} ${transcriptData.student.lastName}`
                ),
                React.createElement(Text, { style: styles.infoLabel }, 'Date of Birth:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  transcriptData.student.dateOfBirth 
                    ? new Date(transcriptData.student.dateOfBirth).toLocaleDateString()
                    : 'Not provided'
                ),
                React.createElement(Text, { style: styles.infoLabel }, 'Graduation Year:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  transcriptData.student.graduationYear.toString()
                )
              ),
              React.createElement(View, { style: styles.academicSummary },
                React.createElement(Text, { style: styles.infoLabel }, 'Cumulative GPA:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  `${transcriptData.cumulativeGPA.toFixed(2)} / ${transcriptData.student.gpaScale ?? '4.0'}`
                ),
                React.createElement(Text, { style: styles.infoLabel }, 'Total Credits:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  `${transcriptData.totalCredits} credits`
                ),
                React.createElement(Text, { style: styles.infoLabel }, 'Required Credits:'),
                React.createElement(Text, { style: styles.infoValue }, 
                  `${formatNumber(transcriptData.student.minCreditsForGraduation) || '24'} credits`
                )
              )
            ),

            // Course Records by Year
            ...Object.entries(transcriptData.coursesByYear).map(([year, courses]) => 
              React.createElement(View, { key: year, style: styles.yearSection },
                React.createElement(View, { style: styles.yearHeader },
                  React.createElement(Text, {}, `Academic Year ${year}`),
                  transcriptData.gpaByYear[year] && React.createElement(Text, { style: styles.yearGpa },
                    `Year GPA: ${transcriptData.gpaByYear[year].gpa.toFixed(2)} | Credits: ${transcriptData.gpaByYear[year].credits}`
                  )
                ),
                React.createElement(View, { style: styles.courseTable },
                  React.createElement(View, { style: styles.tableHeader },
                    React.createElement(Text, { style: [styles.tableCell, styles.courseName] }, 'Course Name'),
                    React.createElement(Text, { style: [styles.tableCell, styles.courseSubject] }, 'Subject'),
                    React.createElement(Text, { style: [styles.tableCell, styles.courseLevel] }, 'Level'),
                    React.createElement(Text, { style: [styles.tableCell, styles.courseCredits] }, 'Credits'),
                    React.createElement(Text, { style: [styles.tableCell, styles.courseGrade] }, 'Grade')
                  ),
                  ...courses.map((item) => 
                    React.createElement(View, { key: item.course.id, style: styles.tableRow },
                      React.createElement(Text, { style: [styles.tableCell, styles.courseName] }, 
                        item.course.name
                      ),
                      React.createElement(Text, { style: [styles.tableCell, styles.courseSubject] }, 
                        item.course.subject ?? 'General'
                      ),
                      React.createElement(Text, { style: [styles.tableCell, styles.courseLevel] }, 
                        item.course.level ?? 'Standard'
                      ),
                      React.createElement(Text, { style: [styles.tableCell, styles.courseCredits] }, 
                        formatNumber(item.course.creditHours)
                      ),
                      React.createElement(Text, { style: [styles.tableCell, styles.courseGrade] }, 
                        item.grade?.grade ?? 'IP'
                      )
                    )
                  )
                )
              )
            ),

            // Test Scores
            transcriptData.testScores.length > 0 && React.createElement(View, { style: styles.testScoresSection },
              React.createElement(Text, { style: styles.testScoresTitle }, 'Standardized Test Scores'),
              React.createElement(View, { style: styles.testScoresGrid },
                ...transcriptData.testScores.map((score) => 
                  React.createElement(View, { key: score.id, style: styles.testScoreCard },
                    React.createElement(Text, { style: styles.testType }, score.testType),
                    React.createElement(Text, { style: styles.testScore }, 
                      `${getTestScoreValue(score.scores, 'total') ?? 'N/A'}${getTestScoreValue(score.scores, 'maxScore') ? ` / ${getTestScoreValue(score.scores, 'maxScore')}` : ''}`
                    ),
                    React.createElement(Text, { style: styles.testDate }, 
                      new Date(score.testDate).toLocaleDateString()
                    ),
                    getTestScoreValue(score.scores, 'percentile') && React.createElement(Text, { style: styles.testPercentile }, 
                      `${getTestScoreValue(score.scores, 'percentile')}th percentile`
                    )
                  )
                )
              )
            ),

            // External Achievements
            transcriptData.achievements.length > 0 && React.createElement(View, { style: styles.achievementsSection },
              React.createElement(Text, { style: styles.achievementsTitle }, 'External Achievements & Certifications'),
              ...Object.entries(
                transcriptData.achievements.reduce((acc, achievement) => {
                  const category = achievement.category;
                  acc[category] ??= [];
                  acc[category].push(achievement);
                  return acc;
                }, {} as Record<string, typeof transcriptData.achievements>)
              ).map(([category, categoryAchievements]) =>
                React.createElement(View, { key: category, style: styles.achievementCategory },
                  React.createElement(Text, { style: styles.achievementCategoryTitle }, category),
                  React.createElement(View, { style: styles.achievementTable },
                    ...categoryAchievements.map((achievement) => {
                      const metadata = typeof achievement.metadata === 'object' && achievement.metadata ? achievement.metadata as Record<string, unknown> : {};
                      const skills = Array.isArray(metadata.skills) ? (metadata.skills as string[]) : [];
                      const score = typeof metadata.score === 'number' || typeof metadata.score === 'string' ? metadata.score : undefined;
                      return React.createElement(View, { key: achievement.id },
                        React.createElement(View, { style: styles.achievementRow },
                          React.createElement(Text, { style: styles.achievementTitle }, achievement.title),
                          React.createElement(Text, { style: styles.achievementProvider }, achievement.provider),
                          React.createElement(Text, { style: styles.achievementDate },
                            new Date(achievement.certificateDate).toLocaleDateString()
                          ),
                          React.createElement(Text, { style: styles.achievementScore },
                            score ? `Score: ${score}` : ''
                          )
                        ),
                        skills.length > 0 && React.createElement(Text, { style: styles.achievementSkills },
                          `Skills: ${skills.join(', ')}`
                        )
                      );
                    })
                  )
                )
              )
            ),

            // Extracurricular Activities
            transcriptData.activities.length > 0 && React.createElement(View, { style: styles.achievementsSection },
              React.createElement(Text, { style: styles.achievementsTitle }, 'Extracurricular Activities'),
              ...Object.entries(
                transcriptData.activities.reduce((acc, activity) => {
                  const category = activity.category;
                  acc[category] ??= [];
                  acc[category].push(activity);
                  return acc;
                }, {} as Record<string, typeof transcriptData.activities>)
              ).map(([category, categoryActivities]) =>
                React.createElement(View, { key: category, style: styles.achievementCategory },
                  React.createElement(Text, { style: styles.achievementCategoryTitle }, category),
                  React.createElement(View, { style: styles.achievementTable },
                    ...categoryActivities.map((activity) => {
                      const metadata = typeof activity.metadata === 'object' && activity.metadata ? activity.metadata as Record<string, unknown> : {};
                      const awards = Array.isArray(metadata.awards) ? (metadata.awards as string[]) : [];
                      const formatDateRange = (start: string, end: string | null) => {
                        const startDate = new Date(start).toLocaleDateString();
                        return end ? `${startDate} - ${new Date(end).toLocaleDateString()}` : `${startDate} - Present`;
                      };

                      return React.createElement(View, { key: activity.id },
                        React.createElement(View, { style: styles.achievementRow },
                          React.createElement(Text, { style: styles.achievementTitle }, activity.activityName),
                          React.createElement(Text, { style: styles.achievementProvider }, activity.organization || ''),
                          React.createElement(Text, { style: styles.achievementDate }, formatDateRange(activity.startDate, activity.endDate)),
                          React.createElement(Text, { style: styles.achievementScore }, activity.role || '')
                        ),
                        awards.length > 0 && React.createElement(Text, { style: styles.achievementSkills },
                          `Awards: ${awards.join(', ')}`
                        )
                      );
                    })
                  )
                )
              )
            ),

            // Footer
            React.createElement(View, { style: styles.footer },
              React.createElement(Text, { style: styles.footerText }, 
                `Generated on ${new Date().toLocaleDateString()}`
              ),
              React.createElement(Text, { style: styles.footerContact }, 
                `Issued by: ${transcriptData.tenant?.name ?? 'Homeschool'} | Contact: ${transcriptData.tenant?.primaryEmail ?? 'contact@homeschool.edu'}`
              )
            )
          )
        );

        // Generate PDF buffer
        const pdfBuffer = await renderToBuffer(MyDocument);
        
        // Convert buffer to base64 for transmission
        const pdfBase64 = pdfBuffer.toString('base64');
        
        return {
          pdf: pdfBase64,
          filename: `${transcriptData.student.firstName}_${transcriptData.student.lastName}_Transcript.pdf`,
        };

      } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});