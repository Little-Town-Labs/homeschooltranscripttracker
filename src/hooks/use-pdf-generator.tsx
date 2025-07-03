import { useCallback, useState } from 'react';

// Types for transcript data (matching database schema types)
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  graduationYear: number;
  gpaScale: string | null;
  minCreditsForGraduation: string | null; // Decimal from database comes as string
}

interface Tenant {
  id: string;
  name: string;
  primaryEmail: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  subscriptionStatus: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Course {
  id: string;
  name: string;
  subject: string | null;
  level: string | null; // Can be null based on actual data
  creditHours: string | null; // Decimal from database comes as string
}

interface Grade {
  grade: string;
  gpaPoints: string | null; // Decimal from database comes as string
}

interface CourseWithGrade {
  course: Course;
  grade: Grade | null;
}



interface TestScore {
  id: string;
  testType: string;
  testDate: string;
  scores: unknown; // Matches database schema
}

interface TranscriptData {
  student: Student;
  tenant: Tenant | undefined;
  coursesByYear: Record<string, CourseWithGrade[]>;
  gpaByYear: Record<string, { gpa: number; credits: number }>;
  cumulativeGPA: number;
  totalCredits: number;
  testScores: TestScore[];
}

interface PdfGenerationOptions {
  format: 'standard' | 'detailed' | 'college-prep';
  includeWatermark?: boolean;
}

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePdf = useCallback(async (
    transcriptData: TranscriptData,
    options: PdfGenerationOptions = { format: 'standard' }
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamic imports to avoid SSR issues
      const [
        { renderToBuffer },
        { Document, Page, Text, View, StyleSheet },
        React
      ] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@react-pdf/renderer'),
        import('react')
      ]);

      // Helper function to safely get test score values
      const getTestScoreValue = (scores: unknown, key: string): number | string | undefined => {
        if (typeof scores === 'object' && scores !== null && key in scores) {
          return (scores as Record<string, unknown>)[key] as number | string | undefined;
        }
        return undefined;
      };

      // Define styles
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

      // Helper function to safely convert string numbers to display values
      const formatNumber = (value: string | number | null): string => {
        if (value === null || value === undefined) return '0';
        return typeof value === 'string' ? value : value.toString();
      };

      // Create PDF document
      const MyDocument = React.createElement(Document, {}, 
        React.createElement(Page, { size: 'A4', style: styles.page },
          // Watermark for trial users
          options.includeWatermark && React.createElement(View, { style: styles.watermark },
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
      
      // Convert to blob
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(`PDF generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePdf,
    isGenerating,
    error,
  };
} 