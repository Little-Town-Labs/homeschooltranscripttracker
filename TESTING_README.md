# Testing Setup Guide - Homeschool Transcript Tracker

## Quick Start

### Installation
```bash
# Install testing dependencies
npm install

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Available Test Commands
```bash
npm run test              # Interactive test runner
npm run test:run          # Run tests once and exit
npm run test:coverage     # Run with coverage report
npm run test:ui           # Open Vitest UI in browser
npm run test:watch        # Watch mode for development
npm run test:unit         # Run only unit tests
npm run test:integration  # Run only integration tests
npm run test:components   # Run only component tests
```

## Testing Stack

### Core Framework
- **Vitest** - Fast test runner with TypeScript support
- **@testing-library/react** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@faker-js/faker** - Test data generation
- **happy-dom** - Fast DOM implementation for testing

### Additional Tools
- **MSW (Mock Service Worker)** - API mocking
- **@vitest/coverage-v8** - Coverage reporting
- **@vitest/ui** - Web-based test UI

## Project Structure

```
tests/
├── setup/
│   ├── test-setup.ts           # Global test configuration
│   └── global-setup.ts         # One-time setup/teardown
├── unit/
│   ├── lib/
│   │   └── calculations.test.ts # GPA and academic calculations
│   ├── server/
│   │   └── api/
│   │       └── student.test.ts  # tRPC router testing
│   └── components/
│       └── forms/
│           └── student-form.test.tsx # React component tests
├── integration/
│   ├── api/                    # Full API workflow tests
│   ├── database/               # Multi-tenant isolation tests
│   └── auth/                   # Authentication flow tests
├── fixtures/
│   └── test-data.ts           # Reusable test data
└── helpers/                   # Test utilities
```

## Writing Tests

### Unit Tests Example
```typescript
// tests/unit/lib/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculateGPA } from '@/lib/calculations'

describe('GPA Calculations', () => {
  it('should calculate 4.0 GPA for all A grades', () => {
    const grades = [
      { letter: 'A', credits: 4 },
      { letter: 'A', credits: 3 }
    ]
    expect(calculateGPA(grades, 4.0)).toBe(4.0)
  })
})
```

### Component Tests Example
```typescript
// tests/unit/components/student-form.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentForm } from '@/components/StudentForm'

it('should submit form with valid data', async () => {
  const onSubmit = vi.fn()
  render(<StudentForm onSubmit={onSubmit} />)
  
  await userEvent.type(screen.getByLabelText('Student Name'), 'John Doe')
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
})
```

### tRPC API Tests Example
```typescript
// tests/unit/server/api/student.test.ts
import { createCaller } from '@/server/api/trpc'
import { studentRouter } from '@/server/api/routers/student'

const createMockContext = () => ({
  session: { user: { tenantId: 'test-tenant' } },
  db: mockDb
})

it('should create student with tenant isolation', async () => {
  const caller = createCaller(studentRouter)(createMockContext())
  const result = await caller.create({ name: 'John Doe', grade: 9 })
  
  expect(result.tenantId).toBe('test-tenant')
})
```

## Test Data Management

### Using Fixtures
```typescript
import { createTestStudent, createAcademicRecord } from '../fixtures/test-data'

// Create single test student
const student = createTestStudent({ name: 'Custom Name' })

// Create complete academic record
const { tenant, student, courses, grades } = createAcademicRecord()
```

### Test Scenarios
```typescript
import { testScenarios } from '../fixtures/test-data'

// Pre-built scenarios for common test cases
const honorStudent = testScenarios.honorStudent()
const strugglingStudent = testScenarios.strugglingStudent()
```

## Testing Multi-Tenant Features

### Row Level Security Testing
```typescript
describe('Multi-tenant isolation', () => {
  it('should prevent cross-tenant access', async () => {
    const tenant1 = createTestTenant()
    const tenant2 = createTestTenant()
    
    const student1 = await createStudent(tenant1.id)
    
    // Try to access from different tenant
    const caller = createCaller(createMockContext(tenant2.id))
    const students = await caller.student.getAll()
    
    expect(students).not.toContain(student1)
  })
})
```

## WSL2 Optimization

### Performance Configuration
The Vitest configuration is optimized for WSL2:
- Limited concurrent threads (4 max)
- Fast DOM implementation (happy-dom)
- Optimized file watching
- Reduced isolation for better performance

### Running Tests in WSL2
```bash
# Recommended: Use native WSL2 terminal
npm run test:watch

# For better performance on large test suites
npm run test:run --reporter=basic

# Use UI mode for debugging
npm run test:ui
```

## Coverage Reports

### Generating Coverage
```bash
# HTML coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Coverage Thresholds
- **Global minimum**: 80%
- **Critical paths**: 100% (auth, calculations, multi-tenant)
- **Business logic**: 90%
- **Components**: 70%

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
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Testing Best Practices

### 1. AAA Pattern
**Arrange** - Set up test data
**Act** - Execute the function
**Assert** - Verify the result

### 2. Test Naming
Use descriptive names: `should [expected behavior] when [condition]`

### 3. Test Isolation
Each test should be independent and not rely on other tests

### 4. Mock External Dependencies
Mock APIs, databases, and third-party services

### 5. Test Edge Cases
- Empty data sets
- Invalid inputs
- Error conditions
- Boundary values

## Debugging Tests

### Using Vitest UI
```bash
npm run test:ui
```
Opens a web interface for test debugging with:
- Interactive test runner
- Code coverage visualization
- Test filtering and search
- Real-time results

### Debug Mode
```bash
# Run specific test file
npx vitest run tests/unit/lib/calculations.test.ts

# Debug specific test
npx vitest run -t "should calculate GPA"

# Watch specific pattern
npx vitest watch tests/unit/components
```

## Common Testing Patterns

### Testing Forms
```typescript
it('should validate required fields', async () => {
  render(<StudentForm onSubmit={mockSubmit} />)
  
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
  
  expect(screen.getByText('Name is required')).toBeInTheDocument()
  expect(mockSubmit).not.toHaveBeenCalled()
})
```

### Testing API Routes
```typescript
it('should handle authentication errors', async () => {
  const caller = createCaller(createMockContext(null)) // No auth
  
  await expect(caller.student.getAll()).rejects.toThrow('Unauthorized')
})
```

### Testing Calculations
```typescript
it('should handle edge case of zero credits', () => {
  const grades = [{ letter: 'A', credits: 0 }]
  expect(calculateGPA(grades)).toBe(0)
})
```

## Troubleshooting

### Common Issues

**Tests failing in WSL2 but not locally:**
- Check file path case sensitivity
- Verify environment variables are set
- Use `happy-dom` instead of `jsdom`

**Slow test performance:**
- Reduce `maxThreads` in vitest.config.ts
- Use `isolate: false` for better performance
- Avoid heavy database operations in unit tests

**Mock not working:**
- Ensure mocks are defined before imports
- Check mock file paths are correct
- Clear mocks between tests with `vi.clearAllMocks()`

### Getting Help
- Check Vitest documentation: https://vitest.dev/
- Testing Library guides: https://testing-library.com/
- Project-specific test examples in `/tests` directory

## Next Steps

1. **Install dependencies**: `npm install`
2. **Run first tests**: `npm run test:run`
3. **Start with unit tests**: Begin with calculations and utility functions
4. **Add component tests**: Test React components with user interactions
5. **Build integration tests**: Test full API workflows
6. **Set up CI/CD**: Add testing to your deployment pipeline

The testing infrastructure is ready - start writing tests for your critical business logic!