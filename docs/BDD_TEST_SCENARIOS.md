# BDD Test Scenarios - Homeschool Transcript Tracker

## Testing Framework Setup

### Recommended Tools
```javascript
const testingStack = {
  e2e: "Playwright with TypeScript",
  bdd: "Playwright Test with BDD-style describe/test",
  unit: "Vitest for components and utilities", 
  api: "Supertest for tRPC procedure testing",
  database: "Database testing with test containers"
};
```

### Test Environment
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## Feature: User Authentication and Onboarding

### Scenario: New homeschool parent creates account
```gherkin
Feature: User Registration and Account Creation

Background:
  Given the application is running
  And the database is clean

Scenario: Successful account creation with email verification
  Given I am a new homeschool parent
  When I visit the signup page
  And I enter my email "sarah@example.com"
  And I enter my password "SecurePass123!"
  And I enter my name "Sarah Johnson"
  And I click "Create Account"
  Then I should see "Please check your email to verify your account"
  And I should receive an email verification link
  When I click the verification link in my email
  Then I should see "Email verified successfully"
  And I should be redirected to the onboarding flow
  And my account should have a free trial subscription
  And my account should have the "primary_guardian" role

Scenario: Account creation with Google OAuth
  Given I am on the signup page
  When I click "Sign up with Google"
  And I authorize the application with Google
  Then I should be redirected to the onboarding flow
  And my account should be created with Google email
  And I should have a free trial subscription

Scenario: Onboarding flow completion
  Given I am a newly registered user
  And I am on the onboarding page
  When I enter my family name "The Johnson Family"
  And I enter my address for transcripts
  And I click "Complete Setup"
  Then I should see "Welcome to your dashboard"
  And I should see the student management interface
  And I should see "Add Your First Student" call-to-action
```

### Scenario: Login and session management
```gherkin
Feature: User Login and Authentication

Scenario: Successful login with valid credentials
  Given I have an existing account with email "sarah@example.com"
  And my account is verified
  When I visit the login page
  And I enter my email "sarah@example.com"
  And I enter my correct password
  And I click "Sign In"
  Then I should be redirected to my dashboard
  And I should see my family name in the header
  And my session should be active

Scenario: Failed login with invalid credentials
  Given I have an existing account
  When I visit the login page
  And I enter my email "sarah@example.com"  
  And I enter an incorrect password
  And I click "Sign In"
  Then I should see "Invalid email or password"
  And I should remain on the login page

Scenario: Session timeout
  Given I am logged in
  And I have been inactive for 60 minutes
  When I try to access any protected page
  Then I should be redirected to the login page
  And I should see "Your session has expired"
```

---

## Feature: Student Management

### Scenario: Adding and managing students
```gherkin
Feature: Student Profile Management

Background:
  Given I am logged in as a primary guardian
  And I have completed onboarding

Scenario: Add first student to family account
  Given I am on the dashboard
  And I have no students in my account
  When I click "Add Your First Student"
  And I enter the student's first name "Emma"
  And I enter the student's last name "Johnson"
  And I enter the graduation year "2026"
  And I enter the student's email "emma@example.com" 
  And I click "Add Student"
  Then I should see "Emma Johnson" in my student list
  And I should see "Class of 2026" under Emma's name
  And Emma should receive an invitation email
  And my billing should update to $8/month

Scenario: Add additional students with discount calculation
  Given I have 1 student in my account
  When I add a second student "Alex Johnson"
  Then my billing should update to $14.40/month (10% discount)
  When I add a third student "Maya Johnson"  
  Then my billing should update to $20.40/month (15% discount)

Scenario: Student accepts invitation and creates account
  Given Emma Johnson has been added to the family account
  And Emma received an invitation email
  When Emma clicks the invitation link
  And Emma creates her password
  And Emma verifies her email
  Then Emma should be logged in with "student" role
  And Emma should see only her own academic records
  And Emma should not have edit permissions

Scenario: Edit student information
  Given I have a student "Emma Johnson" in my account
  When I click on Emma's profile
  And I click "Edit Student"
  And I change the graduation year to "2025"
  And I click "Save Changes"
  Then I should see "Student updated successfully"
  And Emma's graduation year should show "2025"
  And the change should be logged in the audit trail
```

---

## Feature: Academic Tracking - Courses and Grades

### Scenario: Course management
```gherkin
Feature: Course and Grade Management

Background:
  Given I am logged in as a guardian
  And I have a student "Emma Johnson" (Grade 11)

Scenario: Add a new course for a student
  Given I am viewing Emma's academic profile
  When I click "Add Course"
  And I enter the course name "AP Chemistry"
  And I select the subject "Science"
  And I select the level "Advanced Placement"
  And I enter credit hours "1.0"
  And I select academic year "2023-2024"
  And I click "Save Course"
  Then I should see "AP Chemistry" in Emma's course list
  And the course should show "1.0 credits"
  And the course should be categorized under "Science"

Scenario: Add semester grades to a course
  Given Emma has a course "AP Chemistry"
  When I click on "AP Chemistry"
  And I click "Add Grade"
  And I select semester "Fall 2023"
  And I enter the grade "A-"
  And I enter the percentage "92"
  And I click "Save Grade"
  Then I should see "A- (92%)" for Fall 2023
  And the GPA should be automatically calculated
  And Emma's overall GPA should update

Scenario: Calculate cumulative GPA
  Given Emma has the following courses with grades:
    | Course | Credits | Grade | GPA Points |
    | AP Chemistry | 1.0 | A- | 4.7 |
    | English 11 | 1.0 | A | 5.0 |
    | Algebra II | 1.0 | B+ | 4.3 |
  When I view Emma's academic summary
  Then I should see cumulative GPA "4.67"
  And I should see total credits "3.0"

Scenario: Edit existing grade
  Given Emma has a grade "B+" in "Algebra II"
  When I click on the grade
  And I click "Edit Grade"
  And I change the grade to "A-"
  And I enter the percentage "91"
  And I click "Save Changes"
  Then I should see "A- (91%)" for the course
  And the GPA should be recalculated automatically
  And the change should be logged in audit trail
```

---

## Feature: Standardized Test Score Tracking

### Scenario: Recording test scores
```gherkin
Feature: Standardized Test Score Management

Background:
  Given I am logged in as a guardian
  And I have a student "Emma Johnson"

Scenario: Add SAT scores
  Given I am viewing Emma's academic profile
  When I click "Add Test Score"
  And I select test type "SAT"
  And I enter test date "2024-03-15"
  And I enter Math score "720"
  And I enter Evidence-Based Reading and Writing score "680"
  And I click "Save Test Score"
  Then I should see "SAT - March 2024" in the test scores section
  And I should see "Total: 1400" as the composite score
  And I should see "Math: 720, EBRW: 680" as section scores

Scenario: Add multiple ACT attempts
  Given Emma has existing test scores
  When I add ACT scores for "2023-12-10" with composite "30"
  And I add ACT scores for "2024-04-20" with composite "32"
  Then I should see both ACT attempts listed
  And the highest score "32" should be highlighted as "Best Score"
  And both attempts should be available for transcript inclusion

Scenario: Add AP exam scores
  Given Emma is taking AP courses
  When I add AP exam score for "AP Chemistry" 
  And I enter score "4"
  And I enter exam date "2024-05-15"
  Then I should see "AP Chemistry: 4" in the AP scores section
  And the score should be linked to the corresponding course
```

---

## Feature: Transcript Generation

### Scenario: Trial user transcript limitations
```gherkin
Feature: Transcript Generation and Access Control

Background:
  Given I am logged in as a primary guardian
  And I have a student "Emma Johnson" with complete academic records
  And my account is on a free trial

Scenario: Trial user views transcript preview
  Given I am on Emma's academic profile
  When I click "Generate Transcript"
  Then I should see a watermarked preview of the transcript
  And I should see all of Emma's courses and grades
  And I should see calculated GPA
  And I should see "TRIAL VERSION - UPGRADE TO PRINT" watermark
  And the "Download PDF" button should be disabled
  And I should see "Upgrade to download and print" message

Scenario: Trial user attempts to download transcript
  Given I am viewing the transcript preview
  When I click "Download PDF"
  Then I should see a modal "Upgrade Required"
  And I should see pricing information
  And I should see "Start your subscription to unlock PDF downloads"
  And I should have options to "Upgrade Now" or "Continue Trial"
```

### Scenario: Paid user transcript generation
```gherkin
Feature: Full Transcript Access for Paid Users

Background:
  Given I am a paid subscriber
  And I have a student "Emma Johnson" with complete academic records

Scenario: Generate and download PDF transcript
  Given I am on Emma's academic profile
  When I click "Generate Transcript"
  Then I should see the complete transcript preview
  And I should NOT see any watermarks
  When I click "Download PDF"
  Then a PDF file should be downloaded
  And the PDF should contain all academic information
  And the PDF should include my contact information as "School Administrator"
  And the PDF should be professionally formatted

Scenario: Email transcript to college
  Given I have generated Emma's transcript
  When I click "Email Transcript"
  And I enter the recipient email "admissions@university.edu"
  And I enter a message "Please find Emma's transcript attached"
  And I click "Send"
  Then I should see "Transcript sent successfully"
  And the recipient should receive the email with PDF attachment
  And the email should include my contact information

Scenario: Transcript includes all required information
  Given I generate Emma's transcript
  Then the transcript should include:
    | Field | Value |
    | Student Name | Emma Johnson |
    | School Name | The Johnson Family Homeschool |
    | Administrator | Sarah Johnson |
    | Address | [My home address] |
    | Phone | [My phone number] |
    | Email | sarah@example.com |
    | All courses | With grades and credits |
    | Cumulative GPA | Calculated correctly |
    | Total Credits | Sum of all course credits |
    | Test Scores | SAT, ACT, AP scores |
    | Graduation Date | Based on graduation year |
```

---

## Feature: Subscription Management

### Scenario: Trial to paid conversion
```gherkin
Feature: Subscription and Billing Management

Background:
  Given I am on a free trial
  And I have 2 students in my account
  And my trial expires in 3 days

Scenario: Upgrade to paid subscription
  Given I am on my dashboard
  And I see "Trial expires in 3 days" notification
  When I click "Upgrade Now"
  Then I should see the pricing page
  And I should see "2 students × $7.20/month = $14.40/month (10% discount)"
  When I click "Subscribe Monthly"
  And I enter my payment information
  And I click "Start Subscription"
  Then I should see "Subscription activated successfully"
  And I should be able to generate PDF transcripts immediately
  And I should be charged $14.40 for the first month

Scenario: Automatic billing cycle
  Given I have an active subscription
  And my billing date is today
  When the automatic billing runs
  Then I should be charged the correct amount based on my student count
  And I should receive an email receipt
  And my subscription should be extended for another month

Scenario: Add student mid-billing cycle
  Given I have 2 students and an active subscription
  And I am 15 days into my billing cycle
  When I add a 3rd student
  Then my subscription should be updated automatically
  And I should be charged a prorated amount for the remaining 15 days
  And my next full billing should reflect the new student count with 15% discount

Scenario: Payment failure handling
  Given I have an active subscription
  And my credit card expires
  When the automatic billing fails
  Then I should receive an email notification
  And my account should enter a grace period
  And I should have 7 days to update my payment method
  And my access should continue during the grace period
```

---

## Feature: Guardian Invitation System

### Scenario: Multi-guardian family management
```gherkin
Feature: Guardian Invitation and Management

Background:
  Given I am a primary guardian "Sarah Johnson"
  And I have a family account with 2 students

Scenario: Invite co-parent as guardian
  Given I am on the family settings page
  When I click "Invite Guardian"
  And I enter email "david@example.com"
  And I enter name "David Johnson"
  And I select role "Guardian"
  And I click "Send Invitation"
  Then I should see "Invitation sent to david@example.com"
  And David should receive an invitation email
  And the invitation should expire in 72 hours

Scenario: Guardian accepts invitation
  Given David received an invitation to join our family account
  When David clicks the invitation link
  And David creates his account with password
  And David verifies his email
  Then David should be logged in as a "guardian"
  And David should see our family's students
  And David should have full access to academic data
  And David should NOT be able to invite other guardians
  And David should NOT be able to manage billing

Scenario: Multiple guardians working simultaneously  
  Given both Sarah and David are guardians in the same family
  And both are logged in simultaneously
  When Sarah adds a course for Emma
  And David adds a grade for the same course
  Then both changes should be saved successfully
  And both guardians should see the updated information
  And all changes should be logged with the correct guardian attribution
```

---

## Feature: Role-Based Access Control

### Scenario: Permission enforcement
```gherkin
Feature: User Role Permissions and Security

Background:
  Given the following users exist in the Johnson family:
    | Name | Role | Email |
    | Sarah | primary_guardian | sarah@example.com |
    | David | guardian | david@example.com |
    | Emma | student | emma@example.com |

Scenario: Student access restrictions
  Given Emma is logged in as a student
  When Emma tries to access her academic records
  Then Emma should see her own courses and grades (read-only)
  When Emma tries to edit a grade
  Then Emma should see "You don't have permission to edit this"
  When Emma tries to access billing information
  Then Emma should see "Access denied"
  When Emma tries to add a new course
  Then the "Add Course" button should not be visible

Scenario: Guardian permissions vs Primary Guardian
  Given David is logged in as a guardian
  When David tries to add a course for Emma
  Then David should be able to add the course successfully
  When David tries to invite another guardian
  Then David should see "Only the primary guardian can invite others"
  When David tries to access billing settings
  Then David should see "Only the primary guardian can manage billing"

Scenario: Cross-tenant data isolation
  Given there are two separate families in the system:
    | Family | Primary Guardian |
    | Johnson | sarah@example.com |
    | Smith | mary@smith.com |
  When Sarah tries to access Smith family data
  Then Sarah should receive a "Not found" error
  When Sarah searches for students
  Then Sarah should only see Johnson family students
```

---

## Feature: Data Security and Audit Trail

### Scenario: Audit logging
```gherkin
Feature: Security and Audit Trail

Background:
  Given I am logged in as a guardian
  And audit logging is enabled

Scenario: Grade change audit trail
  Given Emma has a grade "B+" in "Algebra II"
  When I change the grade to "A-"
  And I save the changes
  Then an audit log entry should be created with:
    | Field | Value |
    | Action | UPDATE_GRADE |
    | User | Sarah Johnson |
    | Resource | Algebra II - Fall 2023 |
    | Old Value | B+ |
    | New Value | A- |
    | Timestamp | Current time |
    | IP Address | My IP address |

Scenario: View audit trail
  Given I am a primary guardian
  When I navigate to "Account Settings" → "Activity Log"
  Then I should see all recent changes
  And I should see who made each change
  And I should see timestamps for all actions
  And I should be able to filter by date range
  And I should be able to filter by action type

Scenario: Student invitation audit
  Given I invite a new guardian
  When the invitation is sent
  Then an audit log should record:
    | Action | INVITE_GUARDIAN |
    | Target Email | david@example.com |
    | Invited By | Sarah Johnson |
    | Invitation Token | [secure token] |
    | Status | PENDING |
```

---

## Test Data Setup

### Sample Test Data
```typescript
// Test fixtures for BDD scenarios
export const testFamilies = {
  johnson: {
    primaryGuardian: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      password: "SecurePass123!"
    },
    guardian: {
      name: "David Johnson", 
      email: "david@example.com"
    },
    students: [
      {
        name: "Emma Johnson",
        email: "emma@example.com",
        graduationYear: 2026,
        grade: 11
      },
      {
        name: "Alex Johnson",
        email: "alex@example.com", 
        graduationYear: 2028,
        grade: 9
      }
    ]
  }
};

export const testCourses = [
  {
    name: "AP Chemistry",
    subject: "Science", 
    level: "Advanced Placement",
    credits: 1.0,
    academicYear: "2023-2024",
    grades: [
      { semester: "Fall 2023", grade: "A-", percentage: 92 }
    ]
  },
  {
    name: "English 11",
    subject: "English",
    level: "Regular", 
    credits: 1.0,
    academicYear: "2023-2024",
    grades: [
      { semester: "Fall 2023", grade: "A", percentage: 95 }
    ]
  }
];
```

---

## Running BDD Tests

### Test Execution Commands
```bash
# Run all BDD tests
npm run test:e2e

# Run specific feature
npm run test:e2e -- --grep "Authentication"

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Generate test report
npm run test:e2e -- --reporter=html

# Run tests with trace for debugging
npm run test:e2e -- --trace=on
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: BDD Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

These BDD scenarios provide comprehensive coverage of all core features and serve as both documentation and acceptance criteria for development.