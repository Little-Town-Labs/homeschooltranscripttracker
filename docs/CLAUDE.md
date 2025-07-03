# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Homeschool Transcript Tracker** - A SaaS platform for homeschool families to track high school academic records (grades 9-12) and generate professional transcripts for college applications.

## Technology Stack (T3 Stack + Enhancements)
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM + @netlify/neon integration
- **API**: tRPC for type-safe APIs
- **Auth**: NextAuth.js with multi-tenant support
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Netlify (with Functions for serverless)
- **Payments**: Stripe for subscription billing
- **Email**: SendGrid for notifications

## Project Structure
```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components  
├── lib/             # Utilities and configurations
├── server/          # tRPC routers and procedures
├── db/              # Drizzle ORM schema and migrations
└── types/           # TypeScript type definitions
```

## Development Commands
```bash
# Setup
npm create t3-app@latest . --nextAuth --tailwind --trpc
npm install drizzle-orm @netlify/neon

# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio
npm run db:migrate   # Run database migrations

# Code Quality  
npm run lint         # ESLint
npm run type-check   # TypeScript checking
```

## Key Architecture Patterns

### Multi-Tenancy
- Row Level Security (RLS) for data isolation
- Tenant ID in all data models
- Middleware for tenant context

### Role-Based Access Control
- 5-tier role system (Super Admin → Student)
- Permission-based UI rendering
- tRPC middleware for authorization

### Subscription Model
- Per-student pricing ($8/month with discounts)
- Stripe webhooks for billing events
- Feature gating based on subscription status

## Important Implementation Notes
- All academic data must be tenant-isolated
- PDF generation requires active subscription
- Guardian invitations use secure tokens
- Audit logging for all data modifications
- FERPA compliance for educational records

## Database Schema Key Points
- Multi-tenant with `tenant_id` on all tables
- Row Level Security policies for data isolation
- Optimized indexes for multi-tenant queries
- Audit trail for all changes

## Security Requirements
- NextAuth.js for authentication
- Row Level Security for data isolation
- Encrypted sensitive data
- HTTPS everywhere (Netlify handles SSL)
- Regular security audits required

## Pricing & Business Logic
- Trial: 1 month free, no PDF generation
- Paid: $8/student/month with multi-student discounts
- Annual: 16.7% discount (2 months free)
- Automatic proration for plan changes