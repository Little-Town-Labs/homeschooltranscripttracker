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
export type Subject = "English" | "Mathematics" | "Science" | "Social Studies" | "Foreign Language" | "Fine Arts" | "Physical Education" | "Career/Technical Education" | "Elective" | "Other";
export type TestType = "SAT" | "ACT" | "PSAT" | "AP" | "CLEP" | "SAT Subject" | "State Assessment" | "Other";
export type GpaScale = "4.0" | "5.0";

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

// Test score structure (JSON field)
export interface TestScoreData {
  total?: number;
  maxScore?: number;
  percentile?: number;
  [key: string]: number | undefined; // For subscores like math, ebrw, etc.
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
    public statusCode: number = 400
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
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
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