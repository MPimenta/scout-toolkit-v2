## Purpose

Lets signed-in leaders submit new activities attributed to them, keep them private until an admin approves, and edit only while they are still pending.

## ADDED Requirements

### Requirement: Submit starts unapproved and attributed

A signed-in user SHALL create an activity that is stored with `is_approved` false and `created_by` set to their Auth.js user id. Guests SHALL receive 401. The unused `users` table SHALL NOT be the author FK.

#### Scenario: Leader submits an activity

- **WHEN** a signed-in user posts a valid new activity
- **THEN** it is stored unapproved
- **AND** `created_by` is that user

#### Scenario: Guest cannot submit

- **WHEN** a guest posts a new activity
- **THEN** the API returns 401

### Requirement: Public catalogue hides unapproved

Public list and guest detail SHALL omit unapproved activities (404 on detail). The author and any admin SHALL still open the pending activity. After admin approval, the activity SHALL appear in the public catalogue with the author's name as attribution.

#### Scenario: Guest cannot open pending

- **WHEN** a guest requests an unapproved activity by id
- **THEN** the response is 404

#### Scenario: Author can open their pending activity

- **WHEN** the author opens their unapproved activity
- **THEN** they see it with a pending status

#### Scenario: Approved activity shows the author

- **WHEN** an admin approves Ana's activity
- **THEN** the public detail shows Ana as the author

### Requirement: Author edits only while pending

The author SHALL update or withdraw (delete) their own activity while `is_approved` is false. After approval, author writes SHALL return 403 and the activity SHALL stay as approved. Admins MAY still edit approved activities through admin-activities. Further community edits SHALL use edit-suggestions.

#### Scenario: Author updates pending

- **WHEN** the author changes the description of their pending activity
- **THEN** the stored description updates

#### Scenario: Author cannot edit after approval

- **GIVEN** the activity is approved
- **WHEN** the author tries to PATCH it
- **THEN** the API returns 403 and the activity is unchanged

### Requirement: Reject or withdraw removes it from the queue

An admin SHALL reject a pending activity, which SHALL keep it out of the public catalogue and SHALL notify the author in-app when notifications exist. The author SHALL withdraw a pending activity, which SHALL delete it. Rejected rows SHALL NOT appear as approved.

#### Scenario: Author withdraws

- **WHEN** the author deletes their pending activity
- **THEN** the row is gone and the public catalogue is unchanged
