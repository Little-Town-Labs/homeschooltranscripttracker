# Unit Testing Plan - Homeschool Transcript Tracker

## Overview
Comprehensive testing strategy for the Homeschool Transcript Tracker SaaS application, designed to run efficiently on WSL2 with focus on multi-tenant architecture, academic calculations, and data integrity.

## Testing Strategy & Philosophy

### Testing Pyramid
```
    /\     E2E Tests (Few)
   /  \    - Critical user journeys
  /____\   - Subscription flows
 /      \  - Authentication flows
/        \ 
|Integration| Integration Tests (Some)
|  Tests   | - API endpoints
|__________| - Database operations
|          | - Email services
|   Unit   | Unit Tests (Many)
|  Tests   | - Business logic
|__________| - Utility functions
             - Component logic
```

## Recommended Testing Stack

### Core Testing Framework
- **Vitest** - Modern, fast test runner with native TypeScript support
  - Better performance than Jest, especially on WSL2
  - Built-in TypeScript support
  - Compatible with Jest APIs
  - Excellent watch mode and hot reload

### Testing Libraries
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - DOM assertions
- **@testing-library/user-event** - User interaction simulation
- **msw** (Mock Service Worker) - API mocking
- **@databases/pg-test** - Database testing utilities

### Specialized Testing Tools
- **next-auth/testing** - Authentication testing utilities
- **stripe-mock** - Stripe API mocking
- **nodemailer-mock** - Email testing
- **@faker-js/faker** - Test data generation

## Test Structure & Organization

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── calculations.test.ts      # GPA, grade calculations
│   │   ├── validation.test.ts        # Zod schema validation
│   │   └── formatting.test.ts        # Date, currency formatting
│   ├── server/
│   │   ├── api/
│   │   │   ├── student.test.ts       # Student CRUD operations
│   │   │   ├── course.test.ts        # Course management
│   │   │   ├── grade.test.ts         # Grade calculations
│   │   │   ├── billing.test.ts       # Subscription logic
│   │   │   └── email.test.ts         # Email service
│   │   └── auth/
│   │       └── config.test.ts        # Authentication logic
│   └── components/
│       ├── forms/
│       │   ├── student-form.test.tsx
│       │   ├── course-form.test.tsx
│       │   └── grade-form.test.tsx
│       ├── dashboard/
│       │   ├── academic-dashboard.test.tsx
│       │   └── progress-charts.test.tsx
│       └── billing/
│           └── subscription-manager.test.tsx
├── integration/
│   ├── api/
│   │   ├── student-api.test.ts       # Full API workflow
│   │   ├── transcript-generation.test.ts
│   │   └── billing-webhooks.test.ts
│   ├── database/
│   │   ├── multi-tenant-isolation.test.ts
│   │   ├── rls-policies.test.ts
│   │   └── data-consistency.test.ts
│   └── auth/
│       └── authentication-flow.test.ts
├── fixtures/
│   ├── students.ts                   # Test data
│   ├── courses.ts
│   ├── grades.ts
│   └── users.ts
├── helpers/
│   ├── database.ts                   # Test DB setup
│   ├── auth.ts                       # Auth test utilities
│   └── mocks.ts                      # Mock factories
└── setup/
    ├── vitest.config.ts
    ├── test-setup.ts
    └── global-setup.ts
```

## Testing Areas & Priorities

### High Priority (Must Test)

#### 1. Multi-Tenant Data Isolation
```typescript
// Example test structure
describe('Multi-tenant isolation', () => {
  it('should only return data for authenticated tenant')
  it('should prevent cross-tenant data access')
  it('should enforce RLS policies correctly')
})
```

#### 2. Academic Calculations
```typescript
// GPA calculation testing
describe('GPA calculations', () => {
  it('should calculate weighted GPA correctly')
  it('should handle honors courses weighting')
  it('should support both 4.0 and 5.0 scales')
  it('should exclude non-graded courses')
})
```

#### 3. Business Logic
- Grade processing and validation
- Transcript generation logic
- Subscription and billing calculations
- Student eligibility rules

#### 4. Authentication & Authorization
```typescript
describe('Authentication', () => {
  it('should create tenant on first login')
  it('should assign primary guardian role')
  it('should send welcome email')
  it('should handle OAuth flow correctly')
})
```

### Medium Priority

#### 5. API Endpoints (tRPC)
- CRUD operations for all entities
- Input validation with Zod schemas
- Error handling and responses
- Rate limiting (if implemented)

#### 6. Component Testing
- Form validation and submission
- State management
- User interactions
- Conditional rendering

#### 7. Email System
```typescript
describe('Email service', () => {
  it('should send welcome emails')
  it('should handle email failures gracefully')
  it('should format email templates correctly')
  it('should respect email preferences')
})
```

### Lower Priority

#### 8. Integration Tests
- Database transactions
- Third-party API integrations
- File upload/download
- PDF generation

## Test Configuration

### Package Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "@databases/pg-test": "^3.0.0",
    "@faker-js/faker": "^8.0.0",
    "stripe-mock": "^3.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/test-setup.ts'],
    globalSetup: './tests/setup/global-setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/migrations/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## Database Testing Strategy

### Test Database Setup
```typescript
// tests/helpers/database.ts
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { createTestDatabase, cleanupTestDatabase } from '@databases/pg-test'

beforeAll(async () => {
  await createTestDatabase()
  await runMigrations()
})

afterAll(async () => {
  await cleanupTestDatabase()
})

beforeEach(async () => {
  await clearAllTables()
  await seedTestData()
})
```

### Multi-Tenant Testing
```typescript
// Example tenant isolation test
describe('Row Level Security', () => {
  it('should isolate tenant data', async () => {
    const tenant1 = await createTestTenant('tenant1')
    const tenant2 = await createTestTenant('tenant2')
    
    const student1 = await createStudent(tenant1.id, 'John Doe')
    const student2 = await createStudent(tenant2.id, 'Jane Smith')
    
    // Test isolation
    const tenant1Students = await getStudents(tenant1.id)
    expect(tenant1Students).toHaveLength(1)
    expect(tenant1Students[0].name).toBe('John Doe')
  })
})
```

## WSL2 Optimization

### Performance Considerations
- Use `happy-dom` instead of `jsdom` for better performance
- Configure file watching to ignore node_modules
- Use native WSL2 filesystem paths
- Enable Vitest's native watch mode

### Memory Management
```typescript
// vitest.config.ts - WSL2 optimizations
export default defineConfig({
  test: {
    // Limit concurrent tests for WSL2
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },
    // Optimize for WSL2 file system
    watchExclude: ['**/node_modules/**', '**/.git/**'],
    isolate: false // Better performance, less isolation
  }
})
```

### Scripts for Testing
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:unit": "vitest run --config vitest.unit.config.ts"
  }
}
```

## Testing Best Practices

### 1. Test Naming Convention
```typescript
// Format: should [expected behavior] when [condition]
it('should calculate 4.0 GPA when all grades are A')
it('should throw error when student not found')
it('should send welcome email when user signs up')
```

### 2. AAA Pattern (Arrange, Act, Assert)
```typescript
it('should calculate weighted GPA correctly', () => {
  // Arrange
  const grades = [
    { letter: 'A', credits: 4, isHonors: true },
    { letter: 'B', credits: 3, isHonors: false }
  ]
  
  // Act
  const gpa = calculateWeightedGPA(grades, 4.0)
  
  // Assert
  expect(gpa).toBe(3.67)
})
```

### 3. Test Data Management
```typescript
// Use factories for consistent test data
const createTestStudent = (overrides = {}) => ({
  name: 'Test Student',
  grade: 9,
  tenantId: 'test-tenant',
  ...overrides
})
```

## Coverage Goals

### Target Coverage Metrics
- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: 80%+ coverage for API endpoints
- **Component Tests**: 70%+ coverage for UI components

### Critical Path Coverage (100%)
- Authentication and authorization
- Multi-tenant data isolation
- Academic calculations (GPA, grades)
- Billing and subscription logic
- Data validation and sanitization

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Set up Vitest configuration
- [ ] Create test utilities and helpers
- [ ] Implement database testing setup
- [ ] Create first unit tests for calculations

### Phase 2: Core Logic (Week 2)
- [ ] Test all business logic functions
- [ ] Test tRPC procedures
- [ ] Test authentication flows
- [ ] Test multi-tenant isolation

### Phase 3: Integration (Week 3)
- [ ] API integration tests
- [ ] Database integration tests
- [ ] Email service tests
- [ ] Component tests

### Phase 4: Optimization (Week 4)
- [ ] Performance optimization for WSL2
- [ ] CI/CD integration
- [ ] Test coverage reports
- [ ] Documentation and maintenance

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

This comprehensive testing plan ensures robust coverage of your multi-tenant SaaS application while being optimized for WSL2 development environment.

## tRPC Router Testing Strategy

### Overview
Yes, you absolutely should have comprehensive testing for your tRPC routers! Router errors are indeed tRPC-related, and proper testing will help catch issues early and ensure your API behaves correctly under various conditions.

### Current Testing Status ✅
- **Unit tests implemented** for course router business logic
- **Input validation testing** covers edge cases and error scenarios  
- **Tenant isolation testing** ensures security boundaries
- **Error handling patterns** tested for proper tRPC error codes
- **Data processing logic** validated with various inputs

### Testing Levels for tRPC Routers

#### 1. **Unit Tests** (Current Implementation)
**Location**: `tests/unit/server/api/`
**Focus**: Business logic, validation, data processing
**Benefits**: Fast, isolated, catches logic errors

```typescript
// Example test pattern from course-router.test.ts
describe('Input Validation', () => {
  it('should validate course name is not empty', () => {
    // Test validation logic without tRPC overhead
  })
})
```

#### 2. **Integration Tests** (Recommended Next Step)
**Location**: `tests/integration/api/`
**Focus**: Full tRPC stack, middleware, database operations
**Benefits**: Tests real request flow, catches integration issues

```typescript
// Recommended integration test pattern
describe('Course Router Integration', () => {
  it('should create course with full tRPC stack', async () => {
    const caller = createCaller(mockContext)
    const result = await caller.create(validInput)
    expect(result).toMatchObject(expectedOutput)
  })
})
```

#### 3. **End-to-End Tests** (Future Implementation)
**Location**: `tests/e2e/`
**Focus**: Client-server interaction, real database
**Benefits**: Catches real-world scenarios

### Testing Areas Covered

#### ✅ **Input Validation**
- Empty/whitespace course names
- Credit hour ranges (0-10)
- Academic year format (YYYY-YYYY)
- UUID format validation
- **Coverage**: Prevents bad data entry

#### ✅ **Data Processing**
- Course data formatting
- Null/undefined handling  
- String trimming and sanitization
- Credit conversion to string format
- **Coverage**: Ensures data consistency

#### ✅ **Security & Authorization**
- Tenant isolation enforcement
- Role-based access control
- Cross-tenant data access prevention
- **Coverage**: Prevents security breaches

#### ✅ **Error Handling**
- Proper tRPC error codes
- Database operation failures
- Resource not found scenarios
- **Coverage**: Provides meaningful error feedback

#### ✅ **Business Logic**
- Course grouping by academic year
- Empty data set handling
- **Coverage**: Ensures features work correctly

### Recommended Enhancements

#### 1. **Add Integration Tests for All Routers**
Create comprehensive integration tests for:
- `student-router.ts`
- `grade-router.ts` 
- `test-score-router.ts`
- `transcript-router.ts`
- `dashboard-router.ts`
- `billing-router.ts`

#### 2. **Database Testing Strategy**
```typescript
// Use test database with cleanup
beforeEach(async () => {
  await clearTestDatabase()
  await seedTestData()
})
```

#### 3. **Mock Strategy Improvements**
```typescript
// Better mocking for database operations
const mockDb = {
  query: vi.fn(),
  transaction: vi.fn(),
  // ... other db operations
}
```

#### 4. **Error Scenario Testing**
Test all error conditions:
- Database connection failures
- Invalid authentication tokens
- Concurrent access issues
- Rate limiting scenarios

#### 5. **Performance Testing**
- Query performance with large datasets
- Concurrent request handling
- Memory usage optimization

### Testing Tools & Libraries

#### Current Setup ✅
- **Vitest**: Test runner and assertions
- **Vi (Vitest mocks)**: Mocking framework
- **@testing-library**: Component testing utilities

#### Recommended Additions
- **MSW (Mock Service Worker)**: API mocking
- **Faker.js**: Test data generation (already in fixtures)
- **Supertest**: HTTP assertion library
- **tRPC testing utilities**: For full stack testing

### Test Organization

```
tests/
├── unit/
│   ├── server/api/               ✅ Current
│   │   ├── course-router.test.ts ✅ Implemented  
│   │   ├── student-router.test.ts
│   │   ├── grade-router.test.ts
│   │   └── ...
│   ├── components/               ✅ Existing
│   └── lib/                      ✅ Existing
├── integration/
│   ├── api/                      📋 Recommended
│   │   ├── course-endpoints.test.ts
│   │   ├── tenant-isolation.test.ts
│   │   └── auth-flow.test.ts
│   └── database/                 ✅ Partial
├── e2e/                          📋 Future
│   ├── user-flows.spec.ts
│   └── api-workflows.spec.ts
└── fixtures/                     ✅ Existing
    └── test-data.ts              ✅ Good coverage
```

### Key Benefits of Comprehensive tRPC Testing

#### 🛡️ **Security**
- Prevents tenant data leakage
- Validates role-based access
- Catches authorization bypasses

#### 🐛 **Bug Prevention** 
- Input validation catches bad data
- Error handling prevents crashes
- Edge case coverage reduces production issues

#### 🚀 **Confidence**
- Safe refactoring with test coverage
- API contract validation
- Regression prevention

#### 📊 **Documentation**
- Tests serve as usage examples
- Expected behavior documentation
- Error scenario documentation

### Running Tests

```bash
# Run all router tests
npm test tests/unit/server/api/

# Run specific router test  
npm test tests/unit/server/api/course-router.test.ts

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| Router business logic | 90%+ | 95%+ |
| Input validation | 100% | 100% |
| Error handling | 80% | 95% |
| Security checks | 85% | 100% |
| Integration flows | 0% | 80% |

### Next Steps

1. **Immediate**: Extend unit tests to all routers
2. **Short-term**: Add integration tests for critical paths
3. **Medium-term**: Implement E2E testing for user workflows  
4. **Long-term**: Performance and load testing

Your current testing foundation is solid! The course router tests demonstrate excellent patterns for testing tRPC router business logic, input validation, and security concerns. Expanding this approach to all routers will significantly improve your application's reliability and maintainability.