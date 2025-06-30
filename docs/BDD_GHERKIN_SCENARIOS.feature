# Homeschool Transcript Tracker - BDD Test Scenarios
# Using proper Gherkin syntax with letter grades only (A, B, C, D, F)

@authentication
Feature: User Authentication and Onboarding
  As a homeschool parent
  I want to create and manage my family account
  So that I can track my students' academic progress

  Background:
    Given the application is running
    And the database is clean
    And email service is available

  @signup @critical-path
  Scenario: New homeschool parent creates account successfully
    Given I am a new homeschool parent
    When I visit the signup page
    And I enter email "sarah@example.com"
    And I enter password "SecurePass123!"
    And I enter name "Sarah Johnson"
    And I click "Create Account"
    Then I should see "Please check your email to verify your account"
    And I should receive an email verification link at "sarah@example.com"
    When I click the verification link in my email
    Then I should see "Email verified successfully"
    And I should be redirected to the onboarding flow
    And my account should have role "primary_guardian"
    And my subscription should be "trial" status

  @signup @oauth
  Scenario: Parent creates account using Google OAuth
    Given I am on the signup page
    When I click "Sign up with Google"
    And I authorize the application with Google
    Then I should be redirected to the onboarding flow
    And my account should be created with my Google email
    And my subscription should be "trial" status

  @onboarding @critical-path
  Scenario: New user completes onboarding flow
    Given I am a newly registered and verified user
    And I am on the onboarding page
    When I enter family name "The Johnson Family"
    And I enter address "123 Main St, Anytown, ST 12345"
    And I enter phone number "(555) 123-4567"
    And I click "Complete Setup"
    Then I should see "Welcome to your dashboard"
    And I should see "Add Your First Student" call-to-action
    And my tenant should be named "The Johnson Family"

  @login @authentication
  Scenario: User logs in with valid credentials
    Given I have an existing verified account with email "sarah@example.com"
    When I visit the login page
    And I enter email "sarah@example.com"
    And I enter my correct password
    And I click "Sign In"
    Then I should be redirected to my dashboard
    And I should see my family name "The Johnson Family" in the header
    And my session should be active

  @login @error-handling
  Scenario: User attempts login with invalid credentials
    Given I have an existing account
    When I visit the login page
    And I enter email "sarah@example.com"
    And I enter an incorrect password
    And I click "Sign In"
    Then I should see error "Invalid email or password"
    And I should remain on the login page
    And I should not be logged in

  @session @security
  Scenario: Session expires after inactivity
    Given I am logged in as a guardian
    And I have been inactive for 60 minutes
    When I try to access "/dashboard"
    Then I should be redirected to "/login"
    And I should see "Your session has expired"

@student-management
Feature: Student Profile Management
  As a guardian
  I want to add and manage student profiles
  So that I can track each child's academic progress

  Background:
    Given I am logged in as a primary guardian "Sarah Johnson"
    And I have completed onboarding for "The Johnson Family"

  @student @critical-path
  Scenario: Add first student to family account
    Given I am on the dashboard
    And I have no students in my account
    When I click "Add Your First Student"
    And I enter first name "Emma"
    And I enter last name "Johnson"
    And I select graduation year "2026"
    And I enter email "emma@example.com"
    And I click "Add Student"
    Then I should see "Emma Johnson" in my student list
    And I should see "Class of 2026" under Emma's name
    And Emma should receive an invitation email
    And my monthly billing should be "$8.00"

  @student @billing
  Scenario: Family discount applies when adding multiple students
    Given I have 1 student "Emma Johnson" in my account
    When I add a second student:
      | First Name | Last Name | Graduation Year | Email              |
      | Alex       | Johnson   | 2028           | alex@example.com   |
    Then my student count should be 2
    And my monthly billing should be "$14.40"
    And I should see "10% family discount applied"
    When I add a third student:
      | First Name | Last Name | Graduation Year | Email              |
      | Maya       | Johnson   | 2027           | maya@example.com   |
    Then my student count should be 3
    And my monthly billing should be "$20.40"
    And I should see "15% family discount applied"

  @student @invitation
  Scenario: Student accepts invitation and creates account
    Given Emma Johnson has been added to my family account
    And Emma received an invitation email
    When Emma clicks the invitation link
    And Emma creates password "EmmaPass123!"
    And Emma verifies her email
    Then Emma should be logged in with role "student"
    And Emma should see only her own academic records
    And Emma should not have edit permissions for any data

  @student @permissions
  Scenario: Edit student information as guardian
    Given I have student "Emma Johnson" in my account
    When I click on Emma's profile
    And I click "Edit Student"
    And I change graduation year to "2025"
    And I click "Save Changes"
    Then I should see "Student updated successfully"
    And Emma's graduation year should display "2025"
    And the change should be logged in audit trail

@academic-tracking
Feature: Course and Grade Management
  As a guardian
  I want to track courses and grades for my students
  So that I can maintain accurate academic records

  Background:
    Given I am logged in as guardian "Sarah Johnson"
    And I have student "Emma Johnson" (Class of 2026)

  @course @critical-path
  Scenario: Add new course for student
    Given I am viewing Emma's academic profile
    When I click "Add Course"
    And I enter course name "Chemistry"
    And I select subject "Science"
    And I select level "Regular"
    And I enter credit hours "1.0"
    And I select academic year "2023-2024"
    And I click "Save Course"
    Then I should see "Chemistry" in Emma's course list
    And the course should show "1.0 credits"
    And the course should be categorized under "Science"

  @grades @critical-path
  Scenario: Add letter grades to course and calculate GPA
    Given Emma has course "Chemistry" with 1.0 credits
    When I click on "Chemistry"
    And I click "Add Grade"
    And I select semester "Fall 2023"
    And I select grade "A"
    And I click "Save Grade"
    Then I should see grade "A" for Fall 2023
    And the course GPA should be "4.00"
    When I add another grade:
      | Semester    | Grade |
      | Spring 2024 | B     |
    Then I should see grade "B" for Spring 2024
    And the course GPA should be "3.50"

  @gpa @calculation
  Scenario: Calculate cumulative GPA across multiple courses with default 4.0 scale
    Given Emma's GPA scale is set to default "4.0"
    And Emma has the following completed courses:
      | Course     | Credits | Final Grade | GPA Points |
      | Chemistry  | 1.0     | A           | 4.0        |
      | English 11 | 1.0     | A           | 4.0        |
      | Algebra II | 1.0     | B           | 3.0        |
    When I view Emma's academic summary
    Then I should see cumulative GPA "3.67"
    And I should see total credits "3.0"

  @gpa @scale-configuration
  Scenario: Configure custom GPA scale for student
    Given I am viewing Emma's academic settings
    When I click "GPA Settings"
    Then I should see default GPA scale "4.0"
    When I change GPA scale to "5.0"
    And I click "Save GPA Settings"
    Then Emma's GPA scale should be "5.0"
    And grade points should be recalculated:
      | Grade | 4.0 Scale | 5.0 Scale |
      | A     | 4.0       | 5.0       |
      | B     | 3.0       | 4.0       |
      | C     | 2.0       | 3.0       |
      | D     | 1.0       | 2.0       |
      | F     | 0.0       | 0.0       |

  @gpa @weighted-calculation
  Scenario: Calculate GPA with custom 5.0 scale for Advanced Placement courses
    Given Emma's GPA scale is set to "5.0"
    And Emma has the following courses:
      | Course       | Credits | Grade | Level | GPA Points |
      | AP Chemistry | 1.0     | A     | AP    | 5.0        |
      | English 11   | 1.0     | A     | Regular | 5.0      |
      | Algebra II   | 1.0     | B     | Regular | 4.0      |
    When I view Emma's academic summary
    Then I should see cumulative GPA "4.67"
    And all courses should use the 5.0 scale consistently

  @grades @validation
  Scenario: Grade validation enforces letter grades only
    Given Emma has course "Chemistry"
    When I try to enter grade "A-"
    Then I should see error "Only letter grades A, B, C, D, F are allowed"
    When I try to enter grade "85"
    Then I should see error "Only letter grades A, B, C, D, F are allowed"
    When I enter grade "B"
    Then the grade should be saved successfully

  @grades @audit
  Scenario: Grade changes are tracked in audit trail
    Given Emma has grade "B" in "Chemistry"
    When I change the grade to "A"
    And I save the changes
    Then an audit log should be created with:
      | Field     | Value              |
      | Action    | UPDATE_GRADE       |
      | User      | Sarah Johnson      |
      | Resource  | Chemistry - Fall 2023 |
      | Old Value | B                  |
      | New Value | A                  |
    And the timestamp should be current time

@test-scores
Feature: Standardized Test Score Management
  As a guardian
  I want to record standardized test scores
  So that they appear on transcripts for college applications

  Background:
    Given I am logged in as guardian "Sarah Johnson"
    And I have student "Emma Johnson"

  @test-scores @sat
  Scenario: Record SAT scores
    Given I am viewing Emma's academic profile
    When I click "Add Test Score"
    And I select test type "SAT"
    And I enter test date "2024-03-15"
    And I enter Math score "720"
    And I enter Evidence-Based Reading and Writing score "680"
    And I click "Save Test Score"
    Then I should see "SAT - March 2024" in test scores section
    And I should see total score "1400"
    And I should see "Math: 720, EBRW: 680" as section scores

  @test-scores @act
  Scenario: Record multiple ACT attempts and identify best score
    Given Emma has no test scores
    When I add ACT scores:
      | Test Date  | Composite | English | Math | Reading | Science |
      | 2023-12-10 | 30        | 32      | 28   | 30      | 30      |
      | 2024-04-20 | 32        | 34      | 30   | 32      | 32      |
    Then I should see both ACT attempts listed chronologically
    And the score "32" should be highlighted as "Best Score"
    And both attempts should be available for transcript inclusion

  @test-scores @ap
  Scenario: Record AP exam scores linked to courses
    Given Emma is enrolled in "AP Chemistry"
    When I add AP exam score:
      | Course      | Score | Exam Date  |
      | AP Chemistry | 4     | 2024-05-15 |
    Then I should see "AP Chemistry: 4" in AP scores section
    And the score should be linked to the AP Chemistry course

@transcript-generation
Feature: Transcript Generation and PDF Export
  As a guardian
  I want to generate professional transcripts
  So that I can submit them for college applications

  Background:
    Given I am logged in as guardian "Sarah Johnson"
    And I have student "Emma Johnson" with complete academic records:
      | Course     | Credits | Grade |
      | Chemistry  | 1.0     | A     |
      | English 11 | 1.0     | A     |
      | Algebra II | 1.0     | B     |
    And Emma has SAT scores: Math 720, EBRW 680

  @transcript @trial-limitations
  Scenario: Trial user sees watermarked preview only
    Given my subscription status is "trial"
    When I navigate to Emma's transcript page
    And I click "Generate Transcript"
    Then I should see transcript preview with all academic data
    And I should see "TRIAL VERSION - UPGRADE TO PRINT" watermark
    And the "Download PDF" button should be disabled
    And I should see "Upgrade to download and print transcripts"

  @transcript @trial-conversion
  Scenario: Trial user attempts PDF download and sees upgrade prompt
    Given my subscription status is "trial"
    And I am viewing transcript preview
    When I click "Download PDF"
    Then I should see modal "Upgrade Required"
    And I should see current pricing for my student count
    And I should see "Start subscription to unlock PDF downloads"
    And I should have options "Upgrade Now" and "Continue Trial"

  @transcript @paid-user @critical-path
  Scenario: Paid subscriber generates and downloads PDF transcript
    Given my subscription status is "active"
    When I navigate to Emma's transcript page
    And I click "Generate Transcript"
    Then I should see complete transcript preview without watermarks
    When I click "Download PDF"
    Then a PDF file should download with filename "Emma_Johnson_Transcript.pdf"
    And the PDF should contain all courses, grades, and test scores
    And the PDF should include my contact information as school administrator

  @transcript @email-delivery
  Scenario: Email transcript to college admissions
    Given my subscription status is "active"
    And I have generated Emma's transcript
    When I click "Email Transcript"
    And I enter recipient email "admissions@university.edu"
    And I enter subject "Emma Johnson - Homeschool Transcript"
    And I enter message "Please find Emma's official transcript attached."
    And I click "Send Email"
    Then I should see "Transcript sent successfully"
    And an email should be sent to "admissions@university.edu"
    And the email should include PDF attachment
    And the email should include my contact information

  @transcript @content-validation
  Scenario: Generated transcript includes all required information
    Given my subscription status is "active"
    And Emma's GPA scale is set to "4.0"
    When I generate Emma's transcript
    Then the transcript should contain:
      | Field              | Expected Value           |
      | Student Name       | Emma Johnson            |
      | School Name        | The Johnson Family Homeschool |
      | Administrator      | Sarah Johnson           |
      | Address            | 123 Main St, Anytown, ST 12345 |
      | Phone              | (555) 123-4567          |
      | Email              | sarah@example.com       |
      | Graduation Date    | Expected graduation 2026 |
      | GPA Scale          | 4.0                     |
      | Cumulative GPA     | 3.67                    |
      | Total Credits      | 3.0                     |
    And all courses should be listed with grades and credits
    And all test scores should be included
    And GPA scale should be clearly indicated on transcript

@subscription-management
Feature: Subscription and Billing Management
  As a primary guardian
  I want to manage my subscription and billing
  So that I can access premium features

  Background:
    Given I am logged in as primary guardian "Sarah Johnson"
    And I have 2 students in my account

  @subscription @trial-expiration
  Scenario: Trial expiration warning and upgrade prompt
    Given my trial expires in 3 days
    When I visit my dashboard
    Then I should see "Trial expires in 3 days - Upgrade now"
    And I should see current pricing "2 students × $7.20 = $14.40/month"
    When I click "Upgrade Now"
    Then I should be taken to the subscription page
    And I should see "10% family discount" applied

  @subscription @upgrade @critical-path
  Scenario: Upgrade from trial to paid subscription
    Given my subscription status is "trial"
    When I click "Upgrade to Paid Plan"
    Then I should see pricing "2 students × $7.20/month = $14.40/month"
    And I should see "10% family discount applied"
    When I enter payment information:
      | Card Number | 4242424242424242 |
      | Expiry      | 12/25            |
      | CVC         | 123              |
    And I click "Start Subscription"
    Then I should see "Subscription activated successfully"
    And my subscription status should be "active"
    And I should be charged "$14.40" immediately
    And I should be able to generate PDF transcripts

  @subscription @billing-cycle
  Scenario: Automatic monthly billing cycle
    Given I have active subscription with billing date today
    When the automatic billing runs
    Then I should be charged "$14.40" for 2 students with discount
    And I should receive email receipt
    And my subscription should be extended for another month
    And my next billing date should be 1 month from today

  @subscription @proration
  Scenario: Add student mid-billing cycle with proration
    Given I have active subscription with 2 students
    And I am 15 days into my billing cycle
    When I add a third student "Maya Johnson"
    Then my subscription should update automatically
    And I should be charged prorated amount for remaining 15 days
    And my next billing should be "$20.40" (3 students, 15% discount)
    And I should see "15% family discount applied"

  @subscription @payment-failure
  Scenario: Handle payment failure with grace period
    Given I have active subscription
    And my credit card is expired
    When automatic billing fails
    Then I should receive email "Payment Failed - Update Payment Method"
    And my account should enter 7-day grace period
    And I should retain access to all features during grace period
    And I should see banner "Payment failed - Update payment method"

@guardian-management
Feature: Guardian Invitation and Multi-User Access
  As a primary guardian
  I want to invite other guardians to help manage academics
  So that both parents can track student progress

  Background:
    Given I am logged in as primary guardian "Sarah Johnson"
    And I have family account "The Johnson Family"

  @guardian @invitation @critical-path
  Scenario: Invite co-parent as guardian
    Given I am on family settings page
    When I click "Invite Guardian"
    And I enter email "david@example.com"
    And I enter name "David Johnson"
    And I select role "Guardian"
    And I click "Send Invitation"
    Then I should see "Invitation sent to david@example.com"
    And David should receive invitation email
    And invitation should expire in 72 hours
    And invitation status should be "pending"

  @guardian @acceptance
  Scenario: Guardian accepts invitation and joins family
    Given David received invitation to join "The Johnson Family"
    When David clicks invitation link
    And David creates account with password "DavidPass123!"
    And David verifies his email
    Then David should be logged in with role "guardian"
    And David should see "The Johnson Family" students
    And David should have full academic management access
    And David should NOT be able to invite other guardians
    And David should NOT be able to manage billing
    And invitation status should be "accepted"

  @guardian @simultaneous-access
  Scenario: Multiple guardians work simultaneously without conflicts
    Given both Sarah and David are guardians in same family
    And both are logged in simultaneously
    And student "Emma Johnson" exists
    When Sarah adds course "Biology" for Emma
    And David adds grade "A" to "Chemistry" for Emma
    Then both changes should be saved successfully
    And both guardians should see updated information
    And audit trail should show correct guardian for each action

@role-based-access-control
Feature: Role-Based Permissions and Security
  As a system administrator
  I want to enforce role-based permissions
  So that users can only access appropriate data and functions

  Background:
    Given the following users exist in "The Johnson Family":
      | Name          | Role             | Email                |
      | Sarah Johnson | primary_guardian | sarah@example.com    |
      | David Johnson | guardian         | david@example.com    |
      | Emma Johnson  | student          | emma@example.com     |

  @security @student-permissions
  Scenario: Student can only view own data in read-only mode
    Given Emma is logged in as student
    When Emma navigates to her academic records
    Then Emma should see her own courses and grades
    But Emma should not see "Edit" buttons
    When Emma tries to access billing information
    Then Emma should see "Access denied - Students cannot view billing"
    When Emma tries to access another student's records
    Then Emma should see "Not found"

  @security @guardian-limitations
  Scenario: Guardian has academic access but not administrative access
    Given David is logged in as guardian
    When David tries to add course for Emma
    Then David should be able to add course successfully
    When David tries to invite another guardian
    Then David should see "Only primary guardian can invite others"
    When David tries to access billing settings
    Then David should see "Only primary guardian can manage billing"
    When David tries to delete student account
    Then David should see "Only primary guardian can delete students"

  @security @data-isolation
  Scenario: Users cannot access other families' data
    Given there are two families in system:
      | Family        | Primary Guardian    |
      | Johnson Family| sarah@example.com   |
      | Smith Family  | mary@smith.com      |
    When Sarah tries to access Smith family student data
    Then Sarah should receive "Not found" error
    When Sarah searches for students
    Then Sarah should only see Johnson family students
    And Sarah should not see any Smith family data

@data-security
Feature: Data Security and Audit Trail
  As a system administrator
  I want comprehensive audit logging
  So that all data changes are tracked and auditable

  Background:
    Given audit logging is enabled
    And I am logged in as guardian "Sarah Johnson"

  @audit @grade-changes
  Scenario: All grade changes are logged in audit trail
    Given student Emma has grade "B" in "Chemistry"
    When I change the grade to "A"
    And I save the changes
    Then audit log should contain entry:
      | Field       | Value                    |
      | Action      | UPDATE_GRADE             |
      | User ID     | Sarah Johnson's user ID  |
      | User Name   | Sarah Johnson            |
      | Tenant ID   | Johnson Family tenant ID |
      | Resource    | Chemistry - Fall 2023    |
      | Old Value   | B                        |
      | New Value   | A                        |
      | IP Address  | [my current IP]          |
      | Timestamp   | [current timestamp]      |

  @audit @access-control
  Scenario: View audit trail as primary guardian
    Given I am primary guardian
    And there have been recent changes to academic data
    When I navigate to "Account Settings" → "Activity Log"
    Then I should see chronological list of all changes
    And I should see who made each change
    And I should see timestamps for all actions
    And I should be able to filter by date range
    And I should be able to filter by action type
    And I should be able to filter by user

  @audit @invitation-tracking
  Scenario: Guardian invitations are fully audited
    Given I invite guardian "david@example.com"
    When invitation is sent
    Then audit log should record:
      | Action         | INVITE_GUARDIAN     |
      | Target Email   | david@example.com   |
      | Invited By     | Sarah Johnson       |
      | Invitation ID  | [unique token]      |
      | Status         | PENDING             |
    When David accepts invitation
    Then audit log should record:
      | Action         | ACCEPT_INVITATION   |
      | Invitation ID  | [same token]        |
      | New User       | David Johnson       |
      | Status         | ACCEPTED            |