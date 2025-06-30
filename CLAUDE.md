# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Homeschool Transcript Tracker** - A SaaS platform for homeschool families to track high school academic records (grades 9-12) and generate professional transcripts for college applications.

## Technology Stack (T3 Stack + Enhancements)
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM
- **API**: tRPC for type-safe APIs
- **Auth**: NextAuth.js v5 (beta) with multi-tenant support
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Hosting**: Netlify (with Functions for serverless)
- **Payments**: Stripe for subscription billing
- **Email**: SendGrid for notifications

## Project Structure
```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── _components/  # Page-specific components
│   ├── api/          # API routes (auth, trpc)
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── server/           # Server-side code
│   ├── api/          # tRPC routers and procedures
│   ├── auth/         # NextAuth configuration
│   └── db/           # Database schema and connection
├── trpc/             # Client-side tRPC setup
└── styles/           # Global styles
docs/                 # Project documentation
├── PRD.md            # Product Requirements Document
├── BDD_GHERKIN_SCENARIOS.feature # Test scenarios
├── SAAS_ARCHITECTURE.md # Multi-tenant architecture
└── SECURITY_AND_ROLES.md # Security specifications
```

## Development Commands
```bash
# Development
npm run dev          # Start development server (with Turbo)
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Build and start production server

# Database (Drizzle)
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run database migrations  
npm run db:push      # Push schema changes directly to database
npm run db:studio    # Open Drizzle Studio

# Code Quality
npm run check        # Run lint and type check together
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # TypeScript checking
npm run format:check # Check Prettier formatting
npm run format:write # Apply Prettier formatting
```

## Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Required environment variables:
# - AUTH_SECRET (generate with: npx auth secret)
# - DATABASE_URL (NeonDB connection string) ✅ CONFIGURED
# - AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET (for OAuth)
# - STRIPE_PUBLISHABLE_KEY (Stripe public key)
# - STRIPE_SECRET_KEY (Stripe secret key)
# - STRIPE_WEBHOOK_SECRET (Stripe webhook endpoint secret)
# - NEXTAUTH_URL (for Stripe redirects)
```

### Database Configuration Status
- ✅ **DATABASE_URL**: NeonDB connection string configured and tested
- ✅ **Connection**: Verified with `npm run db:push` 
- ✅ **Schema**: Multi-tenant tables deployed with RLS policies

## Key Architecture Patterns

### Multi-Tenancy
- Row Level Security (RLS) for data isolation
- Tenant ID (`tenantId`) in all data models
- Middleware for tenant context enforcement
- Table prefix: `app_` (configured in schema.ts)

### Role-Based Access Control
- 5-tier role system: Super Admin → Support Admin → Primary Guardian → Guardian → Student
- Permission-based UI rendering with tRPC middleware
- Audit logging for all data modifications

### Subscription Model
- Per-student pricing: $8/month with multi-student discounts
- Trial: 1 month free, no PDF transcript generation
- Stripe webhooks for billing events
- Feature gating based on subscription status

## Database Schema Key Points
- Multi-tenant with `tenantId` on all application tables
- Row Level Security policies for tenant isolation
- Optimized indexes for multi-tenant queries
- Letter grades only: A, B, C, D, F (no plus/minus)
- Configurable GPA scales: 4.0 or 5.0 per student (default 4.0)
- Complete audit trail for all changes

## Important Implementation Notes
- All academic data must be tenant-isolated
- PDF transcript generation requires active subscription
- Guardian invitations use secure time-limited tokens
- FERPA compliance for educational records
- NextAuth v5 (beta) for authentication
- Drizzle ORM with PostgreSQL dialect

## Security Requirements
- NextAuth.js v5 for authentication with OAuth providers
- Row Level Security for multi-tenant data isolation
- Encrypted sensitive data in database
- HTTPS everywhere (Netlify handles SSL)
- Input validation with Zod schemas
- CSRF protection via tRPC

## Current Phase: Foundation & Setup (Phase 1) - COMPLETED ✅
**Week 1-2 Completed:**
1. ✅ T3 Stack initialized
2. ✅ NeonDB connection configured and tested
3. ✅ Multi-tenant database schema designed and deployed
4. ✅ Row Level Security policies implemented
5. 🔄 Set up authentication with tenant isolation

## Database Setup Status
- ✅ **NeonDB Connected**: Fixed DATABASE_URL format, connection verified
- ✅ **Schema Deployed**: Complete multi-tenant schema with `app_` prefixed tables
- ✅ **RLS Implemented**: Row Level Security policies for tenant data isolation
- ✅ **Testing Scripts**: Database connection and schema validation completed

### Database Schema Includes:
- **Core Tables**: tenants, users, students, courses, grades, test_scores
- **Access Control**: invitations, audit_logs with full change tracking
- **Multi-tenant**: All tables isolated by tenant_id with RLS enforcement
- **NextAuth Integration**: Compatible account/session tables

## Deployment Guides

### Production Deployment
- **NETLIFY_SETUP.md** - Complete Netlify deployment guide with serverless functions
- **STRIPE_SETUP.md** - Stripe integration and billing system configuration
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment verification checklist

### Key Deployment Files
- `netlify.toml` - Netlify configuration for Next.js deployment
- `.env.example` - Environment variables template with all required keys
- `src/env.js` - Environment validation with Stripe and auth variables

## ✅ COMPLETED FEATURES (All Phases)
1. ✅ **Multi-tenant SaaS Architecture** - Complete with RLS and tenant isolation
2. ✅ **Authentication System** - NextAuth.js v5 with Google OAuth and tenant creation
3. ✅ **Student Management** - Full CRUD with academic tracking
4. ✅ **Course Management** - Academic organization with subjects and levels
5. ✅ **Grade Tracking** - GPA calculation with 4.0/5.0 scales and honors weighting
6. ✅ **Test Score Management** - SAT, ACT, AP, PSAT tracking with best scores
7. ✅ **Transcript Generation** - Professional PDF-ready transcripts with multiple formats
8. ✅ **Academic Dashboard** - Comprehensive analytics and progress tracking
9. ✅ **Stripe Billing Integration** - Complete subscription management with family discounts

## Testing Strategy
- BDD scenarios defined in docs/BDD_GHERKIN_SCENARIOS.feature
- Playwright for E2E testing
- Unit tests for business logic
- Integration tests for tRPC procedures
- ✅ **Multi-tenant data isolation testing**: RLS policies tested and validated

### Database Testing Scripts Available
- `scripts/test-rls-simple.js`: Test Row Level Security policies
- `scripts/test-isolation.js`: Multi-tenant isolation validation
- `scripts/debug-rls.js`: RLS configuration debugging
- `scripts/apply-rls.js`: Apply/reapply RLS policies

## Pricing & Business Logic
- Trial: 1 month free, watermarked transcripts only
- Paid: $8/student/month with family discounts:
  - 2 students: 10% off ($7.20 each)
  - 3 students: 15% off ($6.80 each)  
  - 4+ students: 20% off ($6.40 each)
- Annual: 16.7% discount (2 months free)
- Automatic proration for plan changes