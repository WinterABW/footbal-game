# Delta for wallet-deposits

## ADDED Requirements

### Requirement: Crypto intent submissions SHALL allow empty transaction identifier

For crypto deposit intents, the client-to-service deposit submission SHALL support an empty
transaction identifier to represent asynchronous blockchain proof.

#### Scenario: Empty transactionId accepted for crypto method

- GIVEN a deposit submission for a crypto method with a valid amount
- WHEN the submission is sent with transactionId equal to ''
- THEN the submission is considered valid for client-side flow continuity
- AND no client-side validation error is raised solely due to empty transactionId

#### Scenario: Non-crypto behavior remains unchanged

- GIVEN a deposit submission for a non-crypto method
- WHEN the submission flow is executed
- THEN existing method-specific validation and submission behavior remains unchanged

### Requirement: Crypto deposit registration SHALL communicate pending lifecycle

The system SHALL classify successfully registered crypto intents as pending until external
reconciliation confirms receipt.

#### Scenario: Pending message on successful crypto registration

- GIVEN a crypto deposit intent has been successfully registered
- WHEN user feedback is shown
- THEN the feedback states that funds are pending network/blockchain confirmation

#### Scenario: No premature credited-state messaging

- GIVEN a crypto deposit intent has just been registered
- WHEN user feedback is shown
- THEN the UI MUST NOT claim funds were already credited
