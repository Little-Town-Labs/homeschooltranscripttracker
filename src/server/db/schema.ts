import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";

// Type definition for NextAuth adapter account
// Avoiding direct import to prevent drizzle-kit compatibility issues
type AdapterAccount = {
  type: "oauth" | "oidc" | "email" | "webauthn";
};

/**
 * Multi-tenant database schema for Homeschool Transcript Tracker
 * All application tables are prefixed with "app_" for isolation
 */
export const createTable = pgTableCreator((name) => `app_${name}`);

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "support_admin", 
  "primary_guardian",
  "guardian",
  "student",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active", 
  "past_due",
  "cancelled",
  "suspended",
]);

export const gradeEnum = pgEnum("grade", ["A", "B", "C", "D", "F"]);

export const courseLevelEnum = pgEnum("course_level", [
  "Regular",
  "Honors", 
  "Advanced Placement",
  "Dual Enrollment",
  "College Prep",
]);

export const subjectEnum = pgEnum("subject", [
  "English",
  "Mathematics", 
  "Science",
  "Computer Science",
  "Social Studies",
  "Foreign Language",
  "Fine Arts",
  "Physical Education",
  "Career/Technical Education",
  "Elective",
  "Other",
]);

export const testTypeEnum = pgEnum("test_type", [
  "SAT",
  "ACT", 
  "PSAT",
  "AP",
  "CLEP",
  "SAT Subject",
  "State Assessment",
  "Other",
]);

export const gpaScaleEnum = pgEnum("gpa_scale", ["4.0", "5.0"]);

export const achievementCategoryEnum = pgEnum("achievement_category", [
  "Online Course",
  "Certification",
  "Badge",
  "Award",
  "Other",
]);

export const activityCategoryEnum = pgEnum("activity_category", [
  "Sports",
  "Scouting/Youth Groups",
  "Community Service",
  "Academic Clubs",
  "Arts/Performance",
  "Leadership",
  "Other",
]);

// ============================================================================
// CORE TENANT & USER TABLES
// ============================================================================

/**
 * Tenants represent family accounts (homeschool families)
 * This is the root of our multi-tenant architecture
 */
export const tenants = createTable("tenant", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(), // Family name
  primaryEmail: varchar("primary_email", { length: 255 }).notNull(),
  
  // Contact information for transcripts
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  
  // Subscription management
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial"),
  subscriptionId: varchar("subscription_id", { length: 255 }), // Stripe subscription ID
  customerId: varchar("customer_id", { length: 255 }), // Stripe customer ID
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

/**
 * Users table extended for multi-tenant with roles
 * Compatible with NextAuth while adding tenant isolation and roles
 */
export const users = createTable("user", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  
  // NextAuth fields
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: varchar("image", { length: 255 }),
  
  // Application-specific fields
  role: userRoleEnum("role").default("guardian"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("user_tenant_idx").on(t.tenantId),
  index("user_email_idx").on(t.email),
  index("user_role_idx").on(t.role),
]);

// ============================================================================
// NEXTAUTH TABLES (unchanged from T3 default)
// ============================================================================

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================================================
// STUDENT & ACADEMIC TABLES
// ============================================================================

/**
 * Students within a family/tenant
 * Each student can have a different GPA scale
 */
export const students = createTable("student", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Student information
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }), // Optional student email
  dateOfBirth: date("date_of_birth"),
  graduationYear: integer("graduation_year").notNull(),
  
  // GPA configuration (per student)
  gpaScale: gpaScaleEnum("gpa_scale").default("4.0"),
  
  // Student account linking
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  
  // New field for minimum credits required for graduation
  minCreditsForGraduation: decimal("min_credits_for_graduation", { precision: 4, scale: 1 }).default("24.0"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("student_tenant_idx").on(t.tenantId),
  index("student_graduation_year_idx").on(t.graduationYear),
]);

/**
 * Academic courses taken by students
 */
export const courses = createTable("course", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  
  // Course information
  name: varchar("name", { length: 255 }).notNull(),
  subject: subjectEnum("subject").notNull(),
  level: courseLevelEnum("level").default("Regular"),
  creditHours: decimal("credit_hours", { precision: 3, scale: 2 }).default("1.0"),
  
  // Academic timing
  academicYear: varchar("academic_year", { length: 20 }).notNull(), // e.g., "2023-2024"
  
  // Optional fields
  description: text("description"),
  provider: varchar("provider", { length: 255 }), // Curriculum provider
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("course_tenant_idx").on(t.tenantId),
  index("course_student_idx").on(t.studentId),
  index("course_academic_year_idx").on(t.academicYear),
]);

/**
 * Grades for courses (semester/yearly grades)
 */
export const grades = createTable("grade", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  
  // Grade information
  semester: varchar("semester", { length: 50 }).notNull(), // "Fall 2023", "Spring 2024", "Full Year"
  grade: gradeEnum("grade").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // Optional percentage
  gpaPoints: decimal("gpa_points", { precision: 3, scale: 2 }).notNull(), // Calculated based on student's GPA scale
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("grade_course_idx").on(t.courseId),
  index("grade_semester_idx").on(t.semester),
]);

/**
 * Standardized test scores
 */
export const testScores = createTable("test_score", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),

  // Test information
  testType: testTypeEnum("test_type").notNull(),
  testDate: date("test_date").notNull(),

  // Flexible score storage (JSON for different test formats)
  scores: json("scores").notNull(), // e.g., {"math": 720, "ebrw": 680, "total": 1400}

  // Additional information
  testCenter: varchar("test_center", { length: 255 }),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("test_score_tenant_idx").on(t.tenantId),
  index("test_score_student_idx").on(t.studentId),
  index("test_score_type_date_idx").on(t.testType, t.testDate),
]);

/**
 * External achievements and certifications
 * Track online courses, certifications, badges, and awards from external providers
 */
export const externalAchievements = createTable("external_achievement", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),

  // Achievement metadata
  title: varchar("title", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(), // e.g., "Coursera", "Udemy", "edX"
  category: achievementCategoryEnum("category").notNull(),

  // Certificate/completion details
  certificateDate: date("certificate_date").notNull(),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  verificationUrl: varchar("verification_url", { length: 500 }),

  // Flexible metadata storage for scores, duration, skills, etc.
  metadata: json("metadata"), // e.g., {"score": 95, "duration": "12 weeks", "skills": ["Python", "ML"]}

  // Additional information
  description: text("description"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
  index("achievement_tenant_idx").on(t.tenantId),
  index("achievement_student_idx").on(t.studentId),
  index("achievement_provider_idx").on(t.provider),
  index("achievement_category_idx").on(t.category),
]);

/**
 * Student extracurricular activities
 * Track sports, clubs, community service, leadership, and other activities
 */
export const studentActivities = createTable(
  "student_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    // Core activity info
    activityName: varchar("activity_name", { length: 255 }).notNull(),
    category: activityCategoryEnum("category").notNull(),
    organization: varchar("organization", { length: 255 }),

    // Date tracking
    startDate: date("start_date").notNull(),
    endDate: date("end_date"), // Null = ongoing

    // Leadership & achievements
    role: varchar("role", { length: 255 }), // "Team Captain", "Troop Leader"

    // Flexible metadata for awards, hours, etc.
    metadata: json("metadata"), // { awards: ["Black Belt", "MVP"], hours: 120, competitions: [...] }

    // Additional context
    description: text("description"),
    notes: text("notes"),

    // Audit fields
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("activity_tenant_idx").on(t.tenantId),
    index("activity_student_idx").on(t.studentId),
    index("activity_category_idx").on(t.category),
    index("activity_dates_idx").on(t.startDate, t.endDate),
  ]
);

// ============================================================================
// INVITATION & ACCESS MANAGEMENT
// ============================================================================

/**
 * Invitations for guardians and students to join family accounts
 */
export const invitations = createTable("invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Invitation details
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  
  // Student-specific invitation
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  
  // Status and timing
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, expired, revoked
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  
  // Audit
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("invitation_tenant_idx").on(t.tenantId),
  index("invitation_email_idx").on(t.email),
  index("invitation_token_idx").on(t.token),
  index("invitation_expires_idx").on(t.expiresAt),
]);

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

/**
 * Comprehensive audit log for all data changes
 */
export const auditLogs = createTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  
  // Who and what
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, etc.
  resource: varchar("resource", { length: 100 }).notNull(), // table name or resource type
  resourceId: uuid("resource_id"), // ID of the affected record
  
  // Change details
  oldValues: json("old_values"), // Previous values
  newValues: json("new_values"), // New values
  
  // Request context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("audit_log_tenant_idx").on(t.tenantId),
  index("audit_log_user_idx").on(t.userId),
  index("audit_log_resource_idx").on(t.resource, t.resourceId),
  index("audit_log_timestamp_idx").on(t.timestamp),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  students: many(students),
  courses: many(courses),
  testScores: many(testScores),
  externalAchievements: many(externalAchievements),
  studentActivities: many(studentActivities),
  invitations: many(invitations),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  accounts: many(accounts),
  sessions: many(sessions),
  student: one(students, { fields: [users.id], references: [students.userId] }),
  createdInvitations: many(invitations, { relationName: "creator" }),
  auditLogs: many(auditLogs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tenant: one(tenants, { fields: [students.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [students.userId], references: [users.id] }),
  courses: many(courses),
  testScores: many(testScores),
  externalAchievements: many(externalAchievements),
  studentActivities: many(studentActivities),
  invitations: many(invitations),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  tenant: one(tenants, { fields: [courses.tenantId], references: [tenants.id] }),
  student: one(students, { fields: [courses.studentId], references: [students.id] }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  course: one(courses, { fields: [grades.courseId], references: [courses.id] }),
  createdBy: one(users, { fields: [grades.createdBy], references: [users.id] }),
}));

export const testScoresRelations = relations(testScores, ({ one }) => ({
  tenant: one(tenants, { fields: [testScores.tenantId], references: [tenants.id] }),
  student: one(students, { fields: [testScores.studentId], references: [students.id] }),
}));

export const externalAchievementsRelations = relations(externalAchievements, ({ one }) => ({
  tenant: one(tenants, { fields: [externalAchievements.tenantId], references: [tenants.id] }),
  student: one(students, { fields: [externalAchievements.studentId], references: [students.id] }),
}));

export const studentActivitiesRelations = relations(studentActivities, ({ one }) => ({
  tenant: one(tenants, { fields: [studentActivities.tenantId], references: [tenants.id] }),
  student: one(students, { fields: [studentActivities.studentId], references: [students.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, { fields: [invitations.tenantId], references: [tenants.id] }),
  student: one(students, { fields: [invitations.studentId], references: [students.id] }),
  createdBy: one(users, { fields: [invitations.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// ============================================================================
// LEGACY TABLES (to be removed after migration)
// ============================================================================

export const posts = createTable(
  "post",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }),
    createdById: varchar("created_by_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const postsRelations = relations(posts, ({ one }) => ({
  createdBy: one(users, { fields: [posts.createdById], references: [users.id] }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UserRole = typeof userRoleEnum.enumValues[number];
export type SubscriptionStatus = typeof subscriptionStatusEnum.enumValues[number];
export type Grade = typeof gradeEnum.enumValues[number];
export type CourseLevel = typeof courseLevelEnum.enumValues[number];
export type TestType = typeof testTypeEnum.enumValues[number];
export type GpaScale = typeof gpaScaleEnum.enumValues[number];
export type AchievementCategory = typeof achievementCategoryEnum.enumValues[number];
export type ActivityCategory = typeof activityCategoryEnum.enumValues[number];