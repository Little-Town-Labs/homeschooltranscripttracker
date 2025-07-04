# Test Framework Setup Guide

## Installation and Configuration

### 1. Install Testing Dependencies
```bash
# Core testing framework
npm install -D @playwright/test

# Additional testing utilities
npm install -D vitest @vitest/ui
npm install -D supertest
npm install -D @faker-js/faker

# Database testing
npm install -D testcontainers
```

### 2. Project Structure
```
tests/
├── e2e/                    # End-to-end BDD tests
│   ├── auth/              # Authentication scenarios
│   ├── student-management/ # Student CRUD scenarios  
│   ├── academic-tracking/  # Course and grade scenarios
│   ├── transcripts/       # Transcript generation scenarios
│   └── subscriptions/     # Billing and subscription scenarios
├── integration/           # API integration tests
├── unit/                  # Component unit tests
├── fixtures/              # Test data fixtures
└── utils/                 # Test utilities and helpers
```

### 3. Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## BDD Test Implementation Examples

### 1. Authentication Feature Tests
```typescript
// tests/e2e/auth/registration.spec.ts
import { test, expect } from '@playwright/test';
import { TestDatabase } from '../utils/test-database';
import { EmailService } from '../utils/email-service';

test.describe('User Registration and Account Creation', () => {
  let testDb: TestDatabase;
  let emailService: EmailService;

  test.beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    emailService = new EmailService();
  });

  test.afterAll(async () => {
    await testDb.cleanup();
  });

  test('Successful account creation with email verification', async ({ page }) => {
    // Given I am a new homeschool parent
    await page.goto('/signup');
    
    // When I enter my details and create account
    await page.fill('[data-testid=email-input]', 'sarah@example.com');
    await page.fill('[data-testid=password-input]', 'SecurePass123!');
    await page.fill('[data-testid=name-input]', 'Sarah Johnson');
    await page.click('[data-testid=create-account-btn]');
    
    // Then I should see verification message
    await expect(page.locator('[data-testid=verification-message]'))
      .toContainText('Please check your email to verify your account');
    
    // And I should receive verification email
    const verificationEmail = await emailService.getLastEmail('sarah@example.com');
    expect(verificationEmail.subject).toContain('Verify your email');
    
    // When I click verification link
    const verificationLink = emailService.extractVerificationLink(verificationEmail);
    await page.goto(verificationLink);
    
    // Then I should be verified and redirected
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('[data-testid=success-message]'))
      .toContainText('Email verified successfully');
    
    // And my account should have correct properties
    const user = await testDb.getUserByEmail('sarah@example.com');
    expect(user.role).toBe('primary_guardian');
    expect(user.emailVerified).toBeTruthy();
    
    const tenant = await testDb.getTenantByUserId(user.id);
    expect(tenant.subscriptionStatus).toBe('trial');
  });

  test('Account creation with Google OAuth', async ({ page }) => {
    // Mock Google OAuth for testing
    await page.route('**/api/auth/signin/google', async (route) => {
      // Simulate successful Google OAuth
      await route.fulfill({
        status: 302,
        headers: { 'Location': '/onboarding?auth=google' }
      });
    });
    
    await page.goto('/signup');
    await page.click('[data-testid=google-signin-btn]');
    
    await expect(page).toHaveURL('/onboarding?auth=google');
  });
});
```

### 2. Student Management Tests
```typescript
// tests/e2e/student-management/add-student.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateAs, TestUser } from '../utils/auth-helpers';

test.describe('Student Profile Management', () => {
  let primaryGuardian: TestUser;

  test.beforeEach(async ({ page }) => {
    primaryGuardian = await authenticateAs(page, 'primary_guardian');
  });

  test('Add first student to family account', async ({ page }) => {
    // Given I am on the dashboard with no students
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid=no-students-message]'))
      .toBeVisible();
    
    // When I add a student
    await page.click('[data-testid=add-first-student-btn]');
    await page.fill('[data-testid=student-first-name]', 'Emma');
    await page.fill('[data-testid=student-last-name]', 'Johnson');
    await page.selectOption('[data-testid=graduation-year]', '2026');
    await page.fill('[data-testid=student-email]', 'emma@example.com');
    await page.click('[data-testid=save-student-btn]');
    
    // Then student should appear in list
    await expect(page.locator('[data-testid=student-card]')).toBeVisible();
    await expect(page.locator('[data-testid=student-name]'))
      .toContainText('Emma Johnson');
    await expect(page.locator('[data-testid=graduation-year]'))
      .toContainText('Class of 2026');
    
    // And billing should update
    await expect(page.locator('[data-testid=billing-amount]'))
      .toContainText('$8.00/month');
    
    // And invitation should be sent
    const invitations = await testDb.getInvitationsByEmail('emma@example.com');
    expect(invitations).toHaveLength(1);
    expect(invitations[0].role).toBe('student');
  });

  test('Add multiple students with discount calculation', async ({ page }) => {
    // Given I have one student
    await testDb.createStudent(primaryGuardian.tenantId, {
      firstName: 'Emma',
      lastName: 'Johnson',
      graduationYear: 2026
    });
    
    await page.goto('/dashboard');
    
    // When I add a second student
    await page.click('[data-testid=add-student-btn]');
    await page.fill('[data-testid=student-first-name]', 'Alex');
    await page.fill('[data-testid=student-last-name]', 'Johnson');
    await page.selectOption('[data-testid=graduation-year]', '2028');
    await page.click('[data-testid=save-student-btn]');
    
    // Then billing should show discount
    await expect(page.locator('[data-testid=billing-amount]'))
      .toContainText('$14.40/month');
    await expect(page.locator('[data-testid=discount-info]'))
      .toContainText('10% family discount applied');
    
    // When I add a third student
    await page.click('[data-testid=add-student-btn]');
    await page.fill('[data-testid=student-first-name]', 'Maya');
    await page.fill('[data-testid=student-last-name]', 'Johnson');
    await page.selectOption('[data-testid=graduation-year]', '2027');
    await page.click('[data-testid=save-student-btn]');
    
    // Then billing should show higher discount
    await expect(page.locator('[data-testid=billing-amount]'))
      .toContainText('$20.40/month');
    await expect(page.locator('[data-testid=discount-info]'))
      .toContainText('15% family discount applied');
  });
});
```

### 3. Academic Tracking Tests
```typescript
// tests/e2e/academic-tracking/course-management.spec.ts
import { test, expect } from '@playwright/test';
import { setupGuardianWithStudent } from '../utils/test-setup';

test.describe('Course and Grade Management', () => {
  test('Add course and calculate GPA', async ({ page }) => {
    const { guardian, student } = await setupGuardianWithStudent(page);
    
    // Given I am viewing student's academic profile
    await page.goto(`/students/${student.id}/academics`);
    
    // When I add a new course
    await page.click('[data-testid=add-course-btn]');
    await page.fill('[data-testid=course-name]', 'AP Chemistry');
    await page.selectOption('[data-testid=subject]', 'Science');
    await page.selectOption('[data-testid=level]', 'Advanced Placement');
    await page.fill('[data-testid=credit-hours]', '1.0');
    await page.selectOption('[data-testid=academic-year]', '2023-2024');
    await page.click('[data-testid=save-course-btn]');
    
    // Then course should appear in list
    await expect(page.locator('[data-testid=course-card]')).toBeVisible();
    await expect(page.locator('[data-testid=course-name]'))
      .toContainText('AP Chemistry');
    await expect(page.locator('[data-testid=course-credits]'))
      .toContainText('1.0 credits');
    
    // When I add a grade
    await page.click('[data-testid=course-card]');
    await page.click('[data-testid=add-grade-btn]');
    await page.selectOption('[data-testid=semester]', 'Fall 2023');
    await page.selectOption('[data-testid=grade]', 'A-');
    await page.fill('[data-testid=percentage]', '92');
    await page.click('[data-testid=save-grade-btn]');
    
    // Then grade should display and GPA should calculate
    await expect(page.locator('[data-testid=grade-display]'))
      .toContainText('A- (92%)');
    await expect(page.locator('[data-testid=course-gpa]'))
      .toContainText('4.67'); // A- in AP = 4.67 GPA points
    
    // When I view academic summary
    await page.click('[data-testid=academic-summary-tab]');
    
    // Then cumulative GPA should be calculated
    await expect(page.locator('[data-testid=cumulative-gpa]'))
      .toContainText('4.67');
    await expect(page.locator('[data-testid=total-credits]'))
      .toContainText('1.0');
  });
});
```

### 4. Transcript Generation Tests
```typescript
// tests/e2e/transcripts/generation.spec.ts
import { test, expect } from '@playwright/test';
import { setupCompleteStudent } from '../utils/test-setup';

test.describe('Transcript Generation and Access Control', () => {
  test('Trial user sees watermarked preview only', async ({ page }) => {
    const { guardian, student } = await setupCompleteStudent(page, {
      subscriptionStatus: 'trial'
    });
    
    await page.goto(`/students/${student.id}/transcript`);
    await page.click('[data-testid=generate-transcript-btn]');
    
    // Should see watermarked preview
    await expect(page.locator('[data-testid=transcript-preview]')).toBeVisible();
    await expect(page.locator('[data-testid=trial-watermark]'))
      .toContainText('TRIAL VERSION - UPGRADE TO PRINT');
    
    // Download should be disabled
    await expect(page.locator('[data-testid=download-pdf-btn]')).toBeDisabled();
    
    // Should see upgrade prompt
    await expect(page.locator('[data-testid=upgrade-message]'))
      .toContainText('Upgrade to download and print');
  });

  test('Paid user can generate and download PDF', async ({ page }) => {
    const { guardian, student } = await setupCompleteStudent(page, {
      subscriptionStatus: 'active'
    });
    
    await page.goto(`/students/${student.id}/transcript`);
    await page.click('[data-testid=generate-transcript-btn]');
    
    // Should see clean preview
    await expect(page.locator('[data-testid=transcript-preview]')).toBeVisible();
    await expect(page.locator('[data-testid=trial-watermark]')).not.toBeVisible();
    
    // Should be able to download (server-side PDF generation)
    const downloadPromise = page.waitForDownload();
    await page.click('[data-testid=download-pdf-btn]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*_.*_Transcript\.pdf$/);
    
    // Verify transcript content in preview
    await expect(page.locator('[data-testid=student-name]'))
      .toContainText(student.firstName + ' ' + student.lastName);
    await expect(page.locator('[data-testid=school-administrator]'))
      .toContainText(guardian.name);
  });
});
```

## Test Utilities and Helpers

### 1. Database Test Helper
```typescript
// tests/utils/test-database.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondb/serverless';
import * as schema from '../../src/db/schema';

export class TestDatabase {
  private db;
  
  constructor() {
    const sql = neon(process.env.TEST_DATABASE_URL!);
    this.db = drizzle(sql, { schema });
  }
  
  async setup() {
    // Run migrations
    await this.db.execute(sql`DELETE FROM audit_logs`);
    await this.db.execute(sql`DELETE FROM grades`);
    await this.db.execute(sql`DELETE FROM courses`);
    await this.db.execute(sql`DELETE FROM test_scores`);
    await this.db.execute(sql`DELETE FROM students`);
    await this.db.execute(sql`DELETE FROM invitations`);
    await this.db.execute(sql`DELETE FROM users`);
    await this.db.execute(sql`DELETE FROM tenants`);
  }
  
  async createTenant(data: Partial<typeof schema.tenants.$inferInsert>) {
    const [tenant] = await this.db.insert(schema.tenants)
      .values({
        name: data.name || 'Test Family',
        primaryEmail: data.primaryEmail || 'test@example.com',
        subscriptionStatus: data.subscriptionStatus || 'trial',
        ...data
      })
      .returning();
    return tenant;
  }
  
  async createUser(tenantId: string, data: Partial<typeof schema.users.$inferInsert>) {
    const [user] = await this.db.insert(schema.users)
      .values({
        tenantId,
        email: data.email || 'user@example.com',
        name: data.name || 'Test User',
        role: data.role || 'guardian',
        emailVerified: new Date(),
        ...data
      })
      .returning();
    return user;
  }
  
  async createStudent(tenantId: string, data: Partial<typeof schema.students.$inferInsert>) {
    const [student] = await this.db.insert(schema.students)
      .values({
        tenantId,
        firstName: data.firstName || 'Test',
        lastName: data.lastName || 'Student',
        graduationYear: data.graduationYear || 2026,
        ...data
      })
      .returning();
    return student;
  }
}
```

### 2. Authentication Helper
```typescript
// tests/utils/auth-helpers.ts
import { Page } from '@playwright/test';
import { TestDatabase } from './test-database';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export async function authenticateAs(
  page: Page, 
  role: 'primary_guardian' | 'guardian' | 'student'
): Promise<TestUser> {
  const testDb = new TestDatabase();
  
  // Create tenant and user
  const tenant = await testDb.createTenant({
    name: 'Test Family',
    primaryEmail: 'test@example.com'
  });
  
  const user = await testDb.createUser(tenant.id, {
    email: `${role}@example.com`,
    name: `Test ${role}`,
    role
  });
  
  // Set authentication session
  await page.context().addCookies([{
    name: 'next-auth.session-token',
    value: await generateSessionToken(user),
    domain: 'localhost',
    path: '/'
  }]);
  
  return {
    id: user.id,
    email: user.email,
    name: user.name!,
    role: user.role,
    tenantId: user.tenantId!
  };
}
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug", 
    "test:unit": "vitest",
    "test:coverage": "vitest --coverage",
    "test:report": "playwright show-report"
  }
}
```

This testing framework provides comprehensive BDD test coverage and sets you up for reliable, maintainable tests throughout development.