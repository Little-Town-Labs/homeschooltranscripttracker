# Developer Quick Start Guide

## 🚀 Getting Started with TypeScript-Safe Development

### Quick Setup
```bash
# Clone and setup
git clone <repo>
cd homeschooltranscripttracker
npm install
cp .env.example .env

# Check everything works
npm run typecheck  # Should show ~103 errors (non-production code only)
npm run dev        # Start development server
```

## ✅ Code Quality Standards

### TypeScript Status
- ✅ **All production code is TypeScript-compliant** 
- ✅ **Zero TypeScript errors in business logic**
- ✅ **Unified type system in place**

### Before Making Changes
Always run these commands:
```bash
npm run typecheck  # Ensure no new TypeScript errors
npm run lint       # Check code style
npm run test:unit  # Ensure tests pass
```

## 📋 Key Type Patterns to Follow

### 1. Use Domain Types
```typescript
// ✅ DO: Import from unified type system
import type { Student, Course, Grade } from '@/types/core/domain-types'

// ❌ DON'T: Define types inline
interface Student { ... }
```

### 2. Database Field Names
```typescript
// ✅ CORRECT field names (post-migration)
courses.name           // not courseName
courses.creditHours    // not credits  
grades.grade          // not letterGrade
grades.gpaPoints      // not gradePoints

// JSON structure for test scores
testScores.scores = {
  total: 1400,
  maxScore: 1600, 
  percentile: 95,
  math: 720,
  ebrw: 680
}
```

### 3. tRPC Patterns
```typescript
// ✅ DO: Use proper tRPC patterns
export const myRouter = createTRPCRouter({
  getAll: guardianProcedure
    .query(async ({ ctx }) => {
      return ctx.db.select()...
    }),
  
  create: guardianProcedure
    .input(z.object({...}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert()...
    })
})
```

### 4. Component Typing
```typescript
// ✅ DO: Type component props properly
interface StudentFormProps {
  studentId?: string | null;
  onClose: () => void;
}

export function StudentForm({ studentId, onClose }: StudentFormProps) {
  // Component implementation
}
```

## 🛠️ Common Development Tasks

### Adding New Features
1. **Check types first**: Ensure domain types exist in `src/types/core/domain-types.ts`
2. **Update schema**: Add database fields to `src/server/db/schema.ts`
3. **Create tRPC procedures**: Follow existing patterns in `src/server/api/routers/`
4. **Build components**: Use proper TypeScript typing
5. **Test thoroughly**: Add tests that match new schema

### Debugging TypeScript Errors
```bash
# Check specific files
npx tsc --noEmit src/path/to/file.ts

# Check with details
npm run typecheck | grep "specific-error-pattern"

# Check coverage exclusion
grep -A5 "exclude" tsconfig.json
```

### Working with Database
```bash
# Make schema changes
npm run db:generate  # Generate migration
npm run db:push      # Apply to database
npm run typecheck    # Verify types are updated
```

## 📁 Key Files to Know

### Type Definitions
- `src/types/core/domain-types.ts` - **Single source of truth for all types**
- `src/server/db/schema.ts` - Database schema with inferred types

### Critical Components  
- `src/app/_components/test-score-form.tsx` - JSON scores handling
- `src/app/_components/transcript-preview.tsx` - Field name references
- `src/server/api/routers/` - All tRPC routers with proper patterns

### Configuration
- `src/server/auth/config.ts` - NextAuth.js v5 setup
- `src/app/api/webhooks/stripe/route.ts` - Stripe integration
- `tsconfig.json` - TypeScript configuration (excludes coverage)

## ⚠️ Common Pitfalls to Avoid

### 1. Field Name Confusion
```typescript
// ❌ OLD (will cause TypeScript errors)
course.courseName  
course.credits
grade.letterGrade
grade.gradePoints

// ✅ NEW (correct schema)  
course.name
course.creditHours
grade.grade  
grade.gpaPoints
```

### 2. Test Score Structure
```typescript
// ❌ OLD (flat structure)
testScore.score
testScore.maxScore  
testScore.percentile

// ✅ NEW (JSON structure)
testScore.scores.total
testScore.scores.maxScore
testScore.scores.percentile
```

### 3. Type Assertions
```typescript
// ✅ Use strategic type assertions only when necessary
const auth = NextAuth(config as any)  // For adapter compatibility

// ❌ Don't overuse 'any' - prefer proper typing
const data: any = response  // Avoid this
```

## 🎯 Success Metrics

### Your Development is On Track When:
- ✅ `npm run typecheck` shows no new errors in your code
- ✅ All tests pass with `npm run test:unit`
- ✅ Components render without TypeScript warnings
- ✅ Database queries use correct field names
- ✅ tRPC procedures follow established patterns

### Red Flags:
- ❌ TypeScript errors in `src/app/` or `src/server/` directories
- ❌ Using old field names (courseName, gradePoints, etc.)
- ❌ Flat test score structure instead of JSON
- ❌ Missing type imports from domain-types.ts

## 📚 Additional Resources

- **Migration Details**: `docs/TYPESCRIPT_MIGRATION.md`
- **Project Rules**: `.cursor/rules/` folder
- **Database Schema**: `src/server/db/schema.ts`
- **Type Definitions**: `src/types/core/domain-types.ts`

**Happy coding with full TypeScript safety! 🎉**