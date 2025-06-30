# GPA Scale Configuration Feature
# Comprehensive Gherkin scenarios for configurable GPA scales

@gpa-configuration
Feature: Configurable GPA Scale Management
  As a guardian
  I want to configure the GPA scale for my students
  So that transcripts accurately reflect our homeschool's grading system

  Background:
    Given I am logged in as guardian "Sarah Johnson"
    And I have student "Emma Johnson"
    And the default GPA scale is "4.0"

  @gpa-scale @student-settings
  Scenario: Access student GPA scale settings
    Given I am viewing Emma's profile
    When I click "Academic Settings"
    And I click "GPA Configuration"
    Then I should see current GPA scale "4.0"
    And I should see grade point mapping:
      | Grade | Points |
      | A     | 4.0    |
      | B     | 3.0    |
      | C     | 2.0    |
      | D     | 1.0    |
      | F     | 0.0    |

  @gpa-scale @configuration @critical-path
  Scenario: Change student GPA scale from 4.0 to 5.0
    Given I am in Emma's GPA configuration
    And Emma has existing courses with grades
    When I select GPA scale "5.0"
    Then I should see updated grade point mapping:
      | Grade | Old Points (4.0) | New Points (5.0) |
      | A     | 4.0              | 5.0              |
      | B     | 3.0              | 4.0              |
      | C     | 2.0              | 3.0              |
      | D     | 1.0              | 2.0              |
      | F     | 0.0              | 0.0              |
    When I click "Apply New Scale"
    Then I should see "GPA scale updated successfully"
    And all existing grades should be recalculated using 5.0 scale
    And Emma's cumulative GPA should be recalculated

  @gpa-scale @validation
  Scenario: Validate GPA scale options
    Given I am in Emma's GPA configuration
    When I view available GPA scales
    Then I should see options:
      | Scale | Description           |
      | 4.0   | Standard 4.0 Scale    |
      | 5.0   | Weighted 5.0 Scale    |
      | 100   | Percentage Scale      |
    When I select "100" (percentage scale)
    Then I should see error "Percentage scales not supported for transcripts"
    And I should be prompted to choose 4.0 or 5.0 scale

  @gpa-scale @impact-calculation
  Scenario: GPA recalculation when changing scales
    Given Emma has completed courses:
      | Course     | Credits | Grade |
      | Chemistry  | 1.0     | A     |
      | English 11 | 1.0     | B     |
      | Math       | 1.0     | A     |
    And Emma's GPA scale is "4.0"
    And Emma's current GPA is "3.67" ((4.0 + 3.0 + 4.0) / 3)
    When I change GPA scale to "5.0"
    Then Emma's recalculated GPA should be "4.67" ((5.0 + 4.0 + 5.0) / 3)
    And all course GPAs should be updated:
      | Course     | Old GPA | New GPA |
      | Chemistry  | 4.0     | 5.0     |
      | English 11 | 3.0     | 4.0     |
      | Math       | 4.0     | 5.0     |

  @gpa-scale @level-consistency
  Scenario: GPA scale applies consistently to all course levels
    Given Emma's GPA scale is set to "5.0"
    And Emma has courses with different levels:
      | Course       | Level         | Grade |
      | AP Chemistry | AP            | A     |
      | English 11   | Regular       | A     |
      | Honors Math  | Honors        | B     |
      | PE           | Regular       | A     |
    When I view Emma's academic summary
    Then all courses should use 5.0 scale regardless of level:
      | Course       | Grade | GPA Points |
      | AP Chemistry | A     | 5.0        |
      | English 11   | A     | 5.0        |
      | Honors Math  | B     | 4.0        |
      | PE           | A     | 5.0        |
    And cumulative GPA should be "4.75"

  @gpa-scale @family-settings
  Scenario: Set default GPA scale for entire family
    Given I am in family settings
    When I click "Academic Defaults"
    And I click "Default GPA Scale"
    Then I should see current default "4.0"
    When I change default GPA scale to "5.0"
    And I click "Save Family Defaults"
    Then all new students should default to "5.0" scale
    But existing students should keep their current scales
    And I should see "Family default GPA scale updated to 5.0"

  @gpa-scale @new-student-inheritance
  Scenario: New student inherits family default GPA scale
    Given family default GPA scale is "5.0"
    When I add new student "Alex Johnson"
    And I complete Alex's profile
    Then Alex's GPA scale should automatically be set to "5.0"
    And Alex's grade point mapping should reflect 5.0 scale
    When Alex receives his first grade "A" in "Biology"
    Then the grade should be worth "5.0" GPA points

  @gpa-scale @transcript-display
  Scenario: Transcript clearly indicates GPA scale used
    Given Emma's GPA scale is "5.0"
    And Emma has cumulative GPA "4.67"
    When I generate Emma's transcript
    Then the transcript should prominently display:
      | Field              | Value               |
      | GPA Scale Used     | 5.0                 |
      | Cumulative GPA     | 4.67 (on 5.0 scale) |
    And there should be a note explaining the scale:
      "This transcript uses a 5.0 GPA scale where A=5.0, B=4.0, C=3.0, D=2.0, F=0.0"

  @gpa-scale @audit-trail
  Scenario: GPA scale changes are logged in audit trail
    Given Emma's current GPA scale is "4.0"
    When I change Emma's GPA scale to "5.0"
    And I save the changes
    Then an audit log entry should be created:
      | Field       | Value                    |
      | Action      | UPDATE_GPA_SCALE         |
      | User        | Sarah Johnson            |
      | Student     | Emma Johnson             |
      | Old Scale   | 4.0                      |
      | New Scale   | 5.0                      |
      | Reason      | Scale change requested   |
    And all affected GPAs should be recalculated and logged

  @gpa-scale @error-handling
  Scenario: Handle invalid GPA scale changes gracefully
    Given Emma has 50 completed courses
    And Emma's current GPA scale is "4.0"
    When I attempt to change GPA scale to "5.0"
    And the system encounters an error during recalculation
    Then I should see "Error updating GPA scale - please try again"
    And Emma's GPA scale should remain "4.0"
    And no partial changes should be applied
    And the error should be logged for investigation

  @gpa-scale @multiple-students
  Scenario: Manage different GPA scales for multiple students
    Given I have students:
      | Student        | Current GPA Scale |
      | Emma Johnson   | 4.0               |
      | Alex Johnson   | 4.0               |
      | Maya Johnson   | 4.0               |
    When I change Emma's GPA scale to "5.0"
    And I keep Alex's GPA scale at "4.0"
    And I change Maya's GPA scale to "5.0"
    Then each student should maintain their individual scale:
      | Student        | GPA Scale | Sample A Grade Points |
      | Emma Johnson   | 5.0       | 5.0                   |
      | Alex Johnson   | 4.0       | 4.0                   |
      | Maya Johnson   | 5.0       | 5.0                   |
    And family transcript generation should handle mixed scales correctly

  @gpa-scale @college-communication
  Scenario: Include GPA scale explanation in college communications
    Given Emma's GPA scale is "5.0"
    And I am emailing Emma's transcript to "admissions@university.edu"
    When I compose the email
    Then the default email body should include:
      "Please note: This transcript uses a 5.0 GPA scale.
       On this scale: A=5.0, B=4.0, C=3.0, D=2.0, F=0.0
       Emma's cumulative GPA of [X.XX] should be evaluated accordingly."
    And I should be able to edit this explanation before sending

  @gpa-scale @reporting
  Scenario: Generate GPA scale report for family
    Given I have multiple students with different GPA scales
    When I navigate to "Reports" → "GPA Summary"
    Then I should see summary table:
      | Student        | GPA Scale | Cumulative GPA | Credits |
      | Emma Johnson   | 5.0       | 4.67           | 12.0    |
      | Alex Johnson   | 4.0       | 3.85           | 8.0     |
      | Maya Johnson   | 5.0       | 4.20           | 6.0     |
    And I should see note: "GPAs calculated on different scales - not directly comparable"
    And I should have option to "Standardize All to 4.0 Scale" for comparison