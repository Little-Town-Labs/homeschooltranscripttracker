/**
 * Core Domain Types - Single Source of Truth
 * 
 * This file serves as the unified type system for the Homeschool Transcript Tracker.
 * All application layers should import types from this file to ensure consistency.
 * 
 * Follows EPIC-TSA-001 Unified Type System guidelines from .cursor/rules/core.mdc
 */

import type {
  tenants,
  users,
  students,
  courses,
  grades,
  testScores,
  externalAchievements,
  invitations,
  auditLogs
} from '@/server/db/schema';

// ============================================================================
// DATABASE INFERRED TYPES
// ============================================================================

// Core entity types inferred from schema
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;

export type TestScore = typeof testScores.$inferSelect;
export type NewTestScore = typeof testScores.$inferInsert;

export type ExternalAchievement = typeof externalAchievements.$inferSelect;
export type NewExternalAchievement = typeof externalAchievements.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// ENUM TYPES
// ============================================================================

export type UserRole = "super_admin" | "support_admin" | "primary_guardian" | "guardian" | "student";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";
export type GradeValue = "A" | "B" | "C" | "D" | "F";
export type CourseLevel = "Regular" | "Honors" | "Advanced Placement" | "Dual Enrollment" | "College Prep";
export type Subject = "English" | "Mathematics" | "Science" | "Computer Science" | "Social Studies" | "Foreign Language" | "Fine Arts" | "Physical Education" | "Career/Technical Education" | "Elective" | "Other";
export type TestType = "SAT" | "ACT" | "PSAT" | "AP" | "CLEP" | "SAT Subject" | "State Assessment" | "Other";
export type GpaScale = "4.0" | "5.0";
export type AchievementCategory = "Online Course" | "Certification" | "Badge" | "Award" | "Other";

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

// Test score structure (JSON field)
export interface TestScoreData {
  total?: number;
  maxScore?: number;
  percentile?: number;
  [key: string]: number | string | undefined; // For subscores and custom fields
}

// External achievement metadata structure (JSON field)
export interface ExternalAchievementMetadata {
  score?: number;
  passingScore?: number;
  duration?: string; // e.g., "12 weeks", "40 hours"
  skills?: string[]; // e.g., ["Python", "Machine Learning", "TensorFlow"]
  courseCode?: string;
  instructor?: string;
  [key: string]: string | number | string[] | undefined; // Allow extensibility
}

// GPA calculation result
export interface GpaCalculation {
  gpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  courseCount: number;
  gpaScale: GpaScale;
}

// Academic record for transcripts
export interface AcademicRecord {
  student: Student;
  courses: (Course & {
    grades: Grade[];
  })[];
  testScores: TestScore[];
  gpaCalculation: GpaCalculation;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// Common API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

// ============================================================================
// BILLING TYPES
// ============================================================================

export interface BillingSubscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  items: unknown[];
}

export interface BillingStatus {
  tenant: {
    id: string;
    name: string;
    email: string | null;
    customerId: string | null;
    trialEndsAt: Date | null;
  };
  subscription: BillingSubscription | null;
  trial: {
    isActive: boolean;
    daysRemaining: number;
    endsAt: Date | null;
  };
  students: {
    count: number;
    active: Array<{
      id: string;
      firstName: string;
      lastName: string;
    }>;
  };
  pricing: {
    basePrice: number;
    studentCount: number;
    discountPercentage: number;
    monthlyTotal: number;
    annualTotal: number;
    savings: {
      multiStudent: number;
      annual: number;
    };
  };
  features: {
    canGenerateTranscripts: boolean;
    hasWatermark: boolean;
    maxStudents: number | null;
  };
}

export interface BillingHistory {
  invoices: Array<{
    id: string | undefined;
    number: string | null;
    status: string | null;
    amountPaid: number;
    amountDue: number;
    currency: string;
    created: Date;
    periodStart: Date | null;
    periodEnd: Date | null;
    invoicePdf: string | null | undefined;
    hostedInvoiceUrl: string | null | undefined;
  }>;
  paymentMethods: Array<{
    id: string;
    brand: string | undefined;
    last4: string | undefined;
    expMonth: number | undefined;
    expYear: number | undefined;
  }>;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardRecentActivity {
  grades: Array<{
    grade: Grade;
    course: Course;
    student: Student;
  }>;
  testScores: Array<{
    testScore: TestScore;
    student: Student;
  }>;
}

export interface DashboardUpcomingTask {
  type: string;
  priority: string;
  title: string;
  description: string;
  studentId: string;
  studentName: string;
  courseId: string | null;
  dueDate: Date | null;
}

export interface DashboardStudentProgress {
  student: {
    id: string;
    name: string;
    graduationYear: number;
    gpaScale: string | null;
  };
  academics: {
    gpa: number;
    totalCredits: number;
    completedCredits: number;
    totalCourses: number;
    completedCourses: number;
    completionRate: number;
    achievements: number;
  };
  graduation: {
    progress: number;
    requirements: Record<string, { required: number; earned: number }>;
    meetsRequirements: boolean;
    creditsRemaining: number;
  };
}

export interface DashboardAcademicTrends {
  gpaByYear: Array<{
    year: string;
    gpa: number;
    credits: number;
    studentCount: number;
  }>;
  gradeDistribution: Record<string, number>;
  subjectPerformance: Array<{
    subject: string;
    courseCount: number;
    averageGPA: number;
    totalCredits: number;
  }>;
}

// ============================================================================
// FORM TYPES
// ============================================================================

// Form input types for components
export interface StudentFormData {
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string; // ISO date string
  graduationYear: number;
  gpaScale: GpaScale;
  minCreditsForGraduation: number; // Minimum credits required for graduation for this student
}

export interface CourseFormData {
  studentId: string;
  name: string;
  subject: Subject;
  level: CourseLevel;
  creditHours: number;
  academicYear: string;
  description?: string;
}

export interface GradeFormData {
  courseId: string;
  semester: string;
  grade: GradeValue;
  percentage?: number;
  gpaPoints: number;
}

export interface TestScoreFormData {
  studentId: string;
  testType: TestType;
  testDate: string; // ISO date string
  scores: TestScoreData;
  testCenter?: string;
  notes?: string;
}

export interface ExternalAchievementFormData {
  studentId: string;
  title: string;
  provider: string;
  category: AchievementCategory;
  certificateDate: string; // ISO date string
  certificateUrl?: string;
  verificationUrl?: string;
  metadata?: ExternalAchievementMetadata;
  description?: string;
  notes?: string;
}