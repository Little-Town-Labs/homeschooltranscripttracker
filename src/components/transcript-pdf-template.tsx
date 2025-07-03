import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font 
} from '@react-pdf/renderer';

// Define types for transcript data
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  graduationYear: number;
  gpaScale: string | null;
  minCreditsForGraduation: number | null;
}

interface Tenant {
  name: string | null;
  primaryEmail: string | null;
}

interface Course {
  id: string;
  name: string;
  subject: string | null;
  level: string;
  creditHours: number;
}

interface Grade {
  grade: string;
  gpaPoints: number;
}

interface CourseWithGrade {
  course: Course;
  grade: Grade | null;
}

interface TestScoreData {
  total?: number;
  maxScore?: number;
  percentile?: number;
  [key: string]: unknown;
}

interface TestScore {
  id: string;
  testType: string;
  testDate: string;
  scores: TestScoreData;
}

interface TranscriptData {
  student: Student;
  tenant: Tenant;
  coursesByYear: Record<string, CourseWithGrade[]>;
  gpaByYear: Record<string, { gpa: number; credits: number }>;
  cumulativeGPA: number;
  totalCredits: number;
  testScores: TestScore[];
  generatedAt: Date;
}

interface TranscriptPDFProps {
  data: TranscriptData;
  format: string;
  includeWatermark?: boolean;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    borderBottom: '2px solid #1f2937',
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  generatedDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  partialTranscriptWarning: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderLeft: '4px solid #f59e0b',
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 8,
    color: '#a16207',
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    borderBottom: '1px solid #d1d5db',
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
  },
  infoValue: {
    fontSize: 10,
    flex: 1,
  },
  academicRecord: {
    marginBottom: 20,
  },
  yearSection: {
    marginBottom: 20,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  yearTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  yearGpa: {
    fontSize: 10,
    color: '#6b7280',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #d1d5db',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRight: '1px solid #d1d5db',
  },
  tableCellHeader: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    borderRight: '1px solid #d1d5db',
  },
  courseName: {
    flex: 3,
  },
  courseLevel: {
    flex: 1,
    textAlign: 'center',
  },
  courseCredits: {
    flex: 1,
    textAlign: 'center',
  },
  courseGrade: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  coursePoints: {
    flex: 1,
    textAlign: 'center',
  },
  courseSubject: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  testScoresSection: {
    marginBottom: 20,
  },
  testScoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  testScoreCard: {
    border: '1px solid #d1d5db',
    padding: 10,
    borderRadius: 4,
    width: '30%',
    marginBottom: 10,
  },
  testType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  testScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginVertical: 2,
  },
  testDate: {
    fontSize: 8,
    color: '#6b7280',
  },
  testPercentile: {
    fontSize: 8,
    color: '#9ca3af',
  },
  gradeScale: {
    marginBottom: 20,
  },
  gradeScaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  gradeScaleItem: {
    fontSize: 10,
  },
  gradeScaleNote: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 8,
  },
  footer: {
    borderTop: '2px solid #1f2937',
    paddingTop: 15,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  footerText: {
    marginBottom: 8,
  },
  footerContact: {
    marginBottom: 15,
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 48,
    color: '#e5e7eb',
    opacity: 0.3,
    zIndex: -1,
  },
});

export const TranscriptPDFTemplate: React.FC<TranscriptPDFProps> = ({ 
  data, 
  format, 
  includeWatermark = false 
}) => {
  const { 
    student, 
    tenant, 
    coursesByYear, 
    gpaByYear, 
    cumulativeGPA, 
    totalCredits, 
    testScores, 
    generatedAt 
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for trial users */}
        {includeWatermark && (
          <View style={styles.watermark}>
            <Text>TRIAL VERSION</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>OFFICIAL HIGH SCHOOL TRANSCRIPT</Text>
          <Text style={styles.schoolName}>{tenant?.name ?? "Homeschool"}</Text>
          <Text style={styles.generatedDate}>
            Generated on {generatedAt.toLocaleDateString()}
          </Text>
        </View>

        {/* Partial Transcript Warning */}
        {totalCredits < 20 && (
          <View style={styles.partialTranscriptWarning}>
            <Text style={styles.warningText}>
              Partial Transcript - Academic Work in Progress
            </Text>
            <Text style={styles.warningSubtext}>
              This transcript reflects {totalCredits} credits completed to date. 
              Standard graduation typically requires 20+ credits.
            </Text>
          </View>
        )}

        {/* Student Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Student Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{student.firstName} {student.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>
                {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Graduation Year:</Text>
              <Text style={styles.infoValue}>{student.graduationYear}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student ID:</Text>
              <Text style={styles.infoValue}>{student.id.slice(-8).toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Academic Summary</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cumulative GPA:</Text>
              <Text style={styles.infoValue}>
                {cumulativeGPA.toFixed(2)} ({student.gpaScale} scale)
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Credits:</Text>
              <Text style={styles.infoValue}>{totalCredits}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Required Credits:</Text>
              <Text style={styles.infoValue}>{student.minCreditsForGraduation ?? 24}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Graduation Status:</Text>
              <Text style={styles.infoValue}>
                {totalCredits >= (student.minCreditsForGraduation ?? 24) ? "Meets Requirements" : "In Progress"}
              </Text>
            </View>
          </View>
        </View>

        {/* Academic Record by Year */}
        <View style={styles.academicRecord}>
          <Text style={styles.sectionTitle}>Academic Record</Text>
          
          {Object.entries(coursesByYear)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([year, yearCourses]) => (
              <View key={year} style={styles.yearSection}>
                <View style={styles.yearHeader}>
                  <Text style={styles.yearTitle}>{year} Academic Year</Text>
                                     {gpaByYear[year] && (
                     <Text style={styles.yearGpa}>
                       Year GPA: {gpaByYear[year].gpa.toFixed(2)} | Credits: {gpaByYear[year].credits}
                     </Text>
                   )}
                </View>
                
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, styles.courseName]}>Course</Text>
                    <Text style={[styles.tableCellHeader, styles.courseLevel]}>Level</Text>
                    <Text style={[styles.tableCellHeader, styles.courseCredits]}>Credits</Text>
                    <Text style={[styles.tableCellHeader, styles.courseGrade]}>Grade</Text>
                    <Text style={[styles.tableCellHeader, styles.coursePoints]}>Quality Points</Text>
                  </View>
                  
                  {yearCourses
                    .sort((a, b) => a.course.name.localeCompare(b.course.name))
                    .map((item) => (
                      <View key={item.course.id} style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.courseName]}>
                          <Text>{item.course.name}</Text>
                          {item.course.subject && (
                            <Text style={styles.courseSubject}>({item.course.subject})</Text>
                          )}
                        </View>
                        <Text style={[styles.tableCell, styles.courseLevel]}>
                          {item.course.level}
                        </Text>
                        <Text style={[styles.tableCell, styles.courseCredits]}>
                          {item.course.creditHours}
                        </Text>
                        <Text style={[styles.tableCell, styles.courseGrade]}>
                          {item.grade?.grade ?? "IP"}
                        </Text>
                        <Text style={[styles.tableCell, styles.coursePoints]}>
                          {item.grade ? (Number(item.grade.gpaPoints) * Number(item.course.creditHours)).toFixed(1) : "—"}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ))}
        </View>

        {/* Test Scores */}
        {testScores && testScores.length > 0 && (
          <View style={styles.testScoresSection}>
            <Text style={styles.sectionTitle}>Standardized Test Scores</Text>
                         <View style={styles.testScoresGrid}>
               {testScores.map((score) => {
                 const scores = score.scores;
                 return (
                   <View key={score.id} style={styles.testScoreCard}>
                     <Text style={styles.testType}>{score.testType}</Text>
                     <Text style={styles.testScore}>
                       {scores.total ?? 'N/A'}
                       {scores.maxScore && ` / ${scores.maxScore}`}
                     </Text>
                     <Text style={styles.testDate}>
                       {new Date(score.testDate).toLocaleDateString()}
                     </Text>
                     {scores.percentile && (
                       <Text style={styles.testPercentile}>
                         {scores.percentile}th percentile
                       </Text>
                     )}
                   </View>
                 );
               })}
            </View>
          </View>
        )}

        {/* GPA Scale Legend */}
        <View style={styles.gradeScale}>
          <Text style={styles.sectionTitle}>Grading Scale</Text>
          <View style={styles.gradeScaleGrid}>
            <Text style={styles.gradeScaleItem}><Text style={{fontWeight: 'bold'}}>A:</Text> 4.0</Text>
            <Text style={styles.gradeScaleItem}><Text style={{fontWeight: 'bold'}}>B:</Text> 3.0</Text>
            <Text style={styles.gradeScaleItem}><Text style={{fontWeight: 'bold'}}>C:</Text> 2.0</Text>
            <Text style={styles.gradeScaleItem}><Text style={{fontWeight: 'bold'}}>D:</Text> 1.0</Text>
            <Text style={styles.gradeScaleItem}><Text style={{fontWeight: 'bold'}}>F:</Text> 0.0</Text>
          </View>
          <Text style={styles.gradeScaleNote}>
            * {student.gpaScale} scale used. Honors and AP courses may receive weighted credit.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This transcript is an official record of coursework completed in a homeschool setting.
          </Text>
                     <Text style={styles.footerContact}>
             Issued by: {tenant?.name ?? "Homeschool"} | Contact: {tenant?.primaryEmail ?? "contact@homeschool.edu"}
           </Text>
          <View style={styles.footerMeta}>
            <Text>Transcript ID: TR-{student.id.slice(-8).toUpperCase()}</Text>
            <Text>Page 1 of 1</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}; 