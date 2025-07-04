# Product Requirements Document (PRD)
## Homeschool Transcript Tracker SaaS Platform

**Version:** 1.0  
**Date:** June 2024  
**Author:** Product Team  

---

## Executive Summary

### Product Vision
A modern, secure SaaS platform that enables homeschool families to track high school academic records (grades 9-12) and generate professional transcripts for college applications and external communication.

### Business Objectives
- **Primary Goal**: Capture 5% of US homeschool high school market (~50,000 families)
- **Revenue Target**: $5M ARR by Year 5
- **Market Position**: Premium, user-friendly alternative to outdated desktop solutions

### Success Metrics
- **Conversion**: 25% trial-to-paid conversion rate
- **Retention**: <5% monthly churn rate
- **Growth**: 20% month-over-month customer growth
- **NPS**: >50 Net Promoter Score

---

## Product Overview

### Target Market
- **Primary**: US homeschool families with high school students (grades 9-12)
- **Secondary**: Homeschool co-ops and support groups
- **Market Size**: ~1M homeschool families in US, ~200K with high school students

### Core Value Proposition
- **Simple**: Intuitive interface designed for non-technical parents
- **Secure**: Bank-level security with multi-tenant data isolation
- **Professional**: College-ready transcript formatting
- **Affordable**: Transparent per-student pricing with family discounts

---

## Technical Architecture

### Technology Stack (T3 Stack + Enhancements)

#### Frontend Framework
```typescript
// create-t3-app base configuration
const techStack = {
  framework: "Next.js 14 (App Router)",
  language: "TypeScript",
  styling: "Tailwind CSS",
  ui: "shadcn/ui + Radix UI",
  state: "Zustand",  
  forms: "React Hook Form + Zod",
  api: "tRPC",
  auth: "NextAuth.js"
};
```

#### Backend & Database
```typescript
const backendStack = {
  database: "NeonDB (PostgreSQL)",
  orm: "Drizzle ORM",
  api: "tRPC procedures",
  auth: "NextAuth.js with JWT",
  payments: "Stripe",
  email: "Netlify Functions + SendGrid"
};
```

#### Hosting & Infrastructure
```typescript
const netlifyFeatures = {
  hosting: "Netlify (Static Site + Functions)",
  functions: "Netlify Functions (Serverless)",
  auth: "Netlify Identity (backup auth)",
  forms: "Netlify Forms (contact/support)",
  analytics: "Netlify Analytics",
  monitoring: "Netlify Functions monitoring",
  cdn: "Netlify CDN for static assets",
  previews: "Deploy previews for testing"
};
```

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Database      │
│   (Next.js)     │◄──►│   (tRPC)        │◄──►│   (NeonDB)      │
│   - React       │    │   - Procedures  │    │   - PostgreSQL  │
│   - Tailwind    │    │   - Validation  │    │   - Drizzle ORM │
│   - TypeScript  │    │   - Auth        │    │   - Row Level   │
└─────────────────┘    └─────────────────┘    │     Security    │
                                              └─────────────────┘
         │                        │                     │
         ▼                        ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │   Stripe        │    │   SendGrid      │
│   - Hosting     │    │   - Billing     │    │   - Email       │
│   - Functions   │    │   - Webhooks    │    │   - Notifications│
│   - CDN         │    │   - Subscriptions│    │   - Invitations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Platform administrators
2. **Support Admin** - Customer support staff
3. **Primary Guardian** - Paying customer/family account owner
4. **Guardian** - Additional parents with academic access
5. **Student** - Read-only access to own records

### Permission Matrix
| Feature | Super Admin | Support Admin | Primary Guardian | Guardian | Student |
|---------|-------------|---------------|------------------|----------|---------|
| Tenant Management | ✅ | ❌ | ✅ | ❌ | ❌ |
| Invite Guardians | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage Students | ❌ | ❌ | ✅ | ✅ | ❌ |
| Academic CRUD | ❌ | ❌ | ✅ | ✅ | ❌ |
| View Data | ✅* | ✅* | ✅ | ✅ | Own Only |
| Generate Transcripts | ❌ | ❌ | ✅ | ✅ | ❌ |
| Billing Management | ✅ | ✅* | ✅ | ❌ | ❌ |

*With appropriate permissions and audit trails

---

## Core Features & User Stories

### 1. Authentication & Onboarding

#### User Stories
```gherkin
Feature: User Registration and Onboarding

Scenario: New family signs up
  Given I am a homeschool parent
  When I visit the signup page
  Then I can create an account with email verification
  And I receive onboarding guidance
  And I get a 1-month free trial

Scenario: Guardian invitation
  Given I am a Primary Guardian
  When I invite another guardian via email
  Then they receive a secure invitation link
  And can create their account with family access
```

#### Technical Implementation
```typescript
// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Custom authentication logic
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role,
        tenantId: token.tenantId,
      },
    }),
  },
};
```

### 2. Student Management

#### User Stories
```gherkin
Feature: Student Profile Management

Scenario: Add new student
  Given I am a Guardian
  When I add a new student
  Then I can enter their basic information
  And set their graduation year
  And they appear in my student list

Scenario: Student views own profile
  Given I am a Student
  When I log into my account
  Then I can view my academic progress
  But I cannot edit any information
```

#### Database Schema (Drizzle)
```typescript
// students table
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  graduationYear: integer('graduation_year').notNull(),
  dateOfBirth: date('date_of_birth'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Row Level Security
export const studentsRLS = sql`
  CREATE POLICY tenant_isolation ON students
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id());
`;
```

### 3. Academic Tracking

#### User Stories
```gherkin
Feature: Course and Grade Management

Scenario: Add course with grades
  Given I am a Guardian
  When I add a new course for a student
  Then I can specify subject, level, and credit hours
  And I can record semester grades
  And the GPA is automatically calculated

Scenario: Track standardized test scores
  Given I am a Guardian  
  When I add test scores for a student
  Then I can record SAT, ACT, AP, and other scores
  And associate them with test dates
```

#### Database Schema
```typescript
// courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  level: varchar('level', { length: 50 }), // Regular, Honors, AP, etc.
  creditHours: decimal('credit_hours', { precision: 3, scale: 2 }),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// grades table
export const grades = pgTable('grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  semester: varchar('semester', { length: 20 }).notNull(),
  grade: varchar('grade', { length: 10 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  gpaPoints: decimal('gpa_points', { precision: 3, scale: 2 }),
});

// test_scores table
export const testScores = pgTable('test_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  testType: varchar('test_type', { length: 50 }).notNull(), // SAT, ACT, AP, etc.
  testDate: date('test_date').notNull(),
  scores: json('scores').notNull(), // Flexible JSON for different test formats
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 4. Transcript Generation

#### User Stories  
```gherkin
Feature: Professional Transcript Generation

Scenario: Generate PDF transcript
  Given I am a Guardian with an active subscription
  When I generate a transcript for a student
  Then I get a professional PDF with all academic data
  And it includes parent/guardian contact information
  And it can be printed or emailed

Scenario: Trial user views transcript
  Given I am on a free trial
  When I try to generate a transcript
  Then I can preview the format with a watermark
  But I cannot download or print it
```

#### Technical Implementation
```typescript
// tRPC procedure for transcript generation
export const transcriptRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(z.object({
      studentId: z.string().uuid(),
      format: z.enum(['standard', 'detailed', 'college-prep']).default('standard'),
      includeWatermark: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check subscription status
      const subscription = await checkSubscriptionAccess(ctx.tenantId);
      
      if (!subscription.canGeneratePDF) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'PDF generation requires active subscription'
        });
      }

      // Generate transcript data
      const transcriptData = await generateTranscriptData(input.studentId, ctx.tenantId);
      
      // Generate PDF server-side using React PDF
      const pdfResult = await generatePdfServerSide(transcriptData, {
        format: input.format,
        includeWatermark: input.includeWatermark
      });
      
      return { 
        pdf: pdfResult.pdf, // Base64 encoded PDF
        filename: pdfResult.filename 
      };
    }),
});
```

### 5. Subscription Management

#### User Stories
```gherkin
Feature: Subscription and Billing

Scenario: Start free trial
  Given I am a new user
  When I sign up
  Then I get 1 month free trial
  And I can use all features except PDF generation

Scenario: Upgrade to paid plan
  Given I am on trial with students added
  When I upgrade to paid plan
  Then I am charged per student with appropriate discounts
  And I can immediately generate PDF transcripts
```

#### Stripe Integration
```typescript
// Stripe subscription management
export const billingRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(z.object({
      paymentMethodId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const studentCount = await getStudentCount(ctx.session.user.tenantId);
      const priceId = calculatePriceId(studentCount);
      
      const subscription = await stripe.subscriptions.create({
        customer: ctx.session.user.stripeCustomerId,
        items: [{ price: priceId, quantity: studentCount }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      return subscription;
    }),
});
```

---

## Database Schema (Complete)

### Multi-Tenant Architecture
```typescript
// Core tenant table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  primaryEmail: varchar('primary_email', { length: 255 }).notNull(),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trial'),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table (supports multiple auth providers)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('guardian'),
  emailVerified: timestamp('email_verified'),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Guardian invitations
export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('guardian'),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Row Level Security Policies
```sql
-- Enable RLS on all tenant-specific tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_students ON students
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY tenant_isolation_courses ON courses  
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id());

-- Admin access policy
CREATE POLICY admin_full_access ON students
  FOR ALL TO authenticated
  USING (auth.user_role() = 'super_admin');
```

---

## Security Requirements

### Authentication & Authorization
```typescript
// Middleware for role-based access
export const requireRole = (allowedRoles: Role[]) => {
  return (req: NextRequest, res: NextResponse, next: NextFunction) => {
    const userRole = req.session?.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Tenant isolation middleware
export const requireTenantAccess = (req: NextRequest, res: NextResponse, next: NextFunction) => {
  const userTenantId = req.session?.user?.tenantId;
  const requestedTenantId = req.query.tenantId;
  
  if (userTenantId !== requestedTenantId && req.session?.user?.role !== 'super_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cannot access other tenant data'
    });
  }
  
  next();
};
```

### Data Protection
```typescript
// Encryption for sensitive data
export const encryptSensitiveData = (data: string): string => {
  return crypto.encrypt(data, process.env.ENCRYPTION_KEY);
};

// Audit logging
export const auditLog = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});
```

---

## Pricing & Subscription Model

### Subscription Tiers
```typescript
export const PRICING_TIERS = {
  TRIAL: {
    name: 'Free Trial',
    duration: 30, // days
    price: 0,
    features: ['academic_tracking', 'online_viewing'],
    limitations: ['no_pdf_generation', 'watermarked_preview']
  },
  PAID: {
    name: 'Active Subscription', 
    basePrice: 8.00, // per student per month
    discounts: {
      2: 0.10, // 10% off for 2 students
      3: 0.15, // 15% off for 3 students  
      4: 0.20, // 20% off for 4+ students
    },
    features: ['all_features'],
    annualDiscount: 0.167 // 2 months free
  }
} as const;

// Pricing calculation
export const calculateMonthlyPrice = (studentCount: number): number => {
  const basePrice = PRICING_TIERS.PAID.basePrice;
  const discounts = PRICING_TIERS.PAID.discounts;
  
  let discount = 0;
  if (studentCount >= 4) discount = discounts[4];
  else if (studentCount === 3) discount = discounts[3];
  else if (studentCount === 2) discount = discounts[2];
  
  return studentCount * basePrice * (1 - discount);
};
```

### Stripe Configuration
```typescript
// Stripe webhook handling
export const stripeWebhookHandler = async (req: NextRequest) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
  
  return new Response('Success', { status: 200 });
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
```typescript
const phase1Tasks = [
  "Set up create-t3-app project structure",
  "Configure NeonDB with Drizzle ORM",
  "Implement basic authentication with NextAuth.js",
  "Set up Netlify deployment pipeline",
  "Create basic tenant and user models",
  "Implement Row Level Security policies"
];
```

### Phase 2: Core Features (Weeks 5-8)
```typescript
const phase2Tasks = [
  "Build student management interface",
  "Create course and grade entry forms",
  "Implement GPA calculation logic",
  "Add test score tracking",
  "Build responsive UI with Tailwind CSS",
  "Add form validation with Zod"
];
```

### Phase 3: Advanced Features (Weeks 9-12)
```typescript
const phase3Tasks = [
  "Implement transcript generation",
  "Add PDF export functionality",
  "Build subscription management",
  "Integrate Stripe billing",
  "Add guardian invitation system",
  "Implement audit logging"
];
```

### Phase 4: Launch Preparation (Weeks 13-16)
```typescript
const phase4Tasks = [
  "Complete admin dashboard",
  "Add comprehensive error handling",
  "Implement monitoring and analytics",
  "Complete testing suite",
  "Security audit and penetration testing",
  "Production deployment and launch"
];
```

---

## Success Metrics & KPIs

### Product Metrics
```typescript
export const productMetrics = {
  engagement: {
    DAU: "Daily Active Users",
    transcriptsGenerated: "Monthly transcript generations",
    timeToFirstTranscript: "Days from signup to first transcript"
  },
  conversion: {
    trialToPaid: "Trial to paid subscription rate",
    invitationAcceptance: "Guardian invitation acceptance rate"
  },
  retention: {
    monthlyChurn: "Monthly subscription churn rate",
    cohortRetention: "90-day cohort retention"
  }
};
```

### Business Metrics
```typescript
export const businessMetrics = {
  revenue: {
    MRR: "Monthly Recurring Revenue",
    ARPU: "Average Revenue Per User",
    LTV: "Customer Lifetime Value"
  },
  growth: {
    customerGrowth: "Month-over-month customer growth",
    revenueGrowth: "Month-over-month revenue growth"
  },
  efficiency: {
    CAC: "Customer Acquisition Cost",
    paybackPeriod: "Customer payback period"
  }
};
```

---

## Risk Assessment & Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database performance at scale | High | Medium | Implement caching, optimize queries, monitoring |
| Netlify function cold starts | Medium | High | Optimize function size, implement warming |
| PDF generation performance | Medium | Medium | Async processing, queue system |

### Business Risks  
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Competition from established players | High | Medium | Focus on UX differentiation, rapid iteration |
| Regulatory changes in education | Medium | Low | Monitor policy changes, maintain compliance |
| Economic downturn affecting subscriptions | High | Medium | Freemium model, essential use case |

### Security Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data breach | Very High | Low | Encryption, security audits, compliance |
| Authentication bypass | High | Low | Multi-factor auth, security testing |
| Payment fraud | Medium | Medium | Stripe fraud protection, monitoring |

---

## Appendix

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication  
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
SENDGRID_API_KEY="SG...."

# Encryption
ENCRYPTION_KEY="..."
```

### Development Setup
```bash
# Initialize project
npm create t3-app@latest homeschool-tracker --nextAuth --prisma --tailwind --trpc

# Install additional dependencies
npm install drizzle-orm @neondb/serverless
npm install @stripe/stripe-js stripe
npm install @sendgrid/mail
npm install @radix-ui/react-* class-variance-authority

# Set up database
npm run db:push
npm run db:studio
```

This PRD provides comprehensive specifications for building a production-ready homeschool transcript tracking SaaS platform using modern web technologies and best practices.