@editor @tiny @editor_tiny @tiny_qrcode
Feature: TinyMCE QR code insertion
  In order to share mobile links with students
  As a teacher
  I need to generate and insert a QR code into the TinyMCE editor

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | Course 1 | C1        | topics |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Terry     | Teacher  | teacher1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | C1     | editingteacher |

  @javascript
  Scenario: Teacher inserts a QR code into course summary
    Given I log in as "teacher1"
    And I am on "Course 1" course homepage
    And I navigate to "Settings" in current page administration
    When I click on the "Insert QR code" button for the "Course summary" TinyMCE editor
    Then "Insert QR code" "dialogue" should exist
    When I set the field "QR code content" to "https://moodle.org"
    And I click on "Insert QR code" "button" in the "Insert QR code" "dialogue"
    Then "Insert QR code" "dialogue" should not exist
    And I switch to the "Course summary" TinyMCE editor iframe
    And "//img[contains(@class, 'tiny-qrcode')]" "xpath_element" should exist
    And I switch to the main frame
