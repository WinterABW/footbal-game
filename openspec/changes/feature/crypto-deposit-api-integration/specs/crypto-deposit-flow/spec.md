# crypto-deposit-flow Specification

## Purpose

Define the user-facing flow to register crypto deposit intent from the deposit UI, including
preconditions, modal interactions, API-triggered states, and user feedback.

## Requirements

### Requirement: Crypto method availability MUST depend on configured deposit address

The system MUST prevent users from selecting crypto deposit methods when no crypto deposit
address is configured.

#### Scenario: Crypto methods disabled when address missing

- GIVEN the deposit form is rendered and the configured crypto deposit address is empty
- WHEN the user views available deposit methods
- THEN crypto methods are shown as disabled or unavailable
- AND the UI provides a clear reason that crypto deposits are currently unavailable

#### Scenario: Crypto methods enabled when address exists

- GIVEN the deposit form is rendered and the configured crypto deposit address is present
- WHEN the user views available deposit methods
- THEN crypto methods are selectable

### Requirement: Modal MUST require explicit user confirmation of send intent

The system MUST present a primary confirmation action in the crypto deposit modal before intent
registration.

#### Scenario: User sees actionable confirmation and disclaimer

- GIVEN a user opens the crypto deposit modal with valid amount and method
- WHEN the modal content is displayed
- THEN the modal shows the deposit address and a primary action labeled to confirm funds were sent
- AND the modal shows a disclaimer that credit occurs after blockchain/network confirmation

### Requirement: Confirmation submission MUST register intent with pending semantics

When the user confirms sent funds, the system MUST submit a deposit intent using the selected
amount and method, with transactionId set to an empty string.

#### Scenario: Submit crypto intent

- GIVEN a user is in the crypto deposit modal with valid amount and method
- WHEN the user clicks the confirmation action
- THEN the system submits a deposit request containing amount, method, and transactionId as ''
- AND the UI enters a loading state until request completion

#### Scenario: Duplicate submits prevented while loading

- GIVEN a confirmation request is in progress
- WHEN the user attempts to click confirmation again
- THEN additional submissions are blocked until the request resolves

### Requirement: Success and failure feedback MUST be explicit and actionable

The system MUST provide clear success and error outcomes for crypto intent submission.

#### Scenario: Success feedback after registration

- GIVEN a crypto intent submission completes successfully
- WHEN the response is received
- THEN the modal closes
- AND the user receives feedback that the deposit is pending reconciliation/network confirmation

#### Scenario: Recoverable error feedback on failure

- GIVEN a crypto intent submission fails
- WHEN the failure is received
- THEN the modal remains open
- AND the user sees an error message with a retry path
