<!-- Merged from change: integrar-user-status-after-auth on 2026-03-26 -->
# Authentication Spec (merged)

## Delta applied from change: integrar-user-status-after-auth

The following requirements were introduced by the change and are now part of the main Authentication spec.

## ADDED Requirements

### Requirement: UserStatusService with Signal-Based State

The system **MUST** provide a new `UserStatusService` that manages user status data using Angular signals and integrates with the existing authentication flow.

#### Scenario: UserStatusService provides reactive user status

- GIVEN the UserStatusService is initialized
- WHEN a user successfully authenticates
- THEN the service MUST expose user status data via signals
- AND the data MUST include: referrealId, wallet info, settings, skills level report

#### Scenario: UserStatusService integrates with AuthService login

- GIVEN a user successfully logs in via AuthService.login()
- WHEN the authentication token is received
- THEN UserStatusService MUST automatically fetch and populate user status
- AND the status signals MUST be updated with fresh data

#### Scenario: UserStatusService integrates with AuthService register

- GIVEN a user successfully registers via AuthService.register()
- WHEN the registration completes and token is received
- THEN UserStatusService MUST automatically fetch and populate user status
- AND the status signals MUST be updated with the new user's data

#### Scenario: UserStatusService integrates with AuthService guest

- GIVEN a user successfully authenticates as guest via AuthService.guest()
- WHEN the guest token is received
- THEN UserStatusService MUST automatically fetch and populate user status
- AND the status signals MUST include the guest user's referrealId if available

#### Scenario: UserStatusService handles getUserStatus API failure

- GIVEN authentication succeeded but getUserStatus API call fails
- WHEN the UserStatusService attempts to fetch status
- THEN the service MUST log the error
- AND the status signals MUST remain in a safe empty/null state
- AND the authentication flow MUST NOT be blocked

### Requirement: Signal-Based User Data Access

The system **MUST** expose user status data through readonly signals for reactive consumption across the application.

#### Scenario: Readonly signals prevent external mutations

- GIVEN the UserStatusService exposes status signals
- WHEN a component tries to directly mutate a readonly signal
- THEN TypeScript MUST prevent compilation
- AND components MUST only read values reactively

#### Scenario: Computed signals derive referrealId availability

- GIVEN the UserStatusService has loaded user status
- WHEN the referrealId field is populated
- THEN a computed signal `hasReferralId()` MUST return true
- AND when referrealId is null, it MUST return false

### Requirement: Auth Flow Integration

The system **MUST** trigger UserStatusService.loadUserStatus() immediately after successful authentication in all auth methods.

#### Scenario: Login triggers status load

- GIVEN AuthService.login() succeeds
- WHEN the user is authenticated and token stored
- THEN AuthService MUST call UserStatusService.loadUserStatus()
- AND this MUST happen before returning success to the component

#### Scenario: Register triggers status load

- GIVEN AuthService.register() succeeds
- WHEN the user is registered and token stored
- THEN AuthService MUST call UserStatusService.loadUserStatus()
- AND this MUST happen before returning success to the component

#### Scenario: Guest auth triggers status load

- GIVEN AuthService.guest() succeeds
- WHEN the guest user is authenticated and token stored
- THEN AuthService MUST call UserStatusService.loadUserStatus()
- AND this MUST happen before returning success to the component

#### Scenario: Logout clears user status

- GIVEN a user is authenticated with loaded status
- WHEN AuthService.logout() is called
- THEN UserStatusService MUST clear all status signals
- AND set them to null/empty state

## MODIFIED Requirements

None — this is a new integration, no existing requirements are being changed.

## REMOVED Requirements

None — this change is purely additive.
