<!-- Merged from change: integrar-user-status-after-auth on 2026-03-26 -->
# Social / Referrals Spec (merged)

## Delta applied from change: integrar-user-status-after-auth

### Requirement: SocialComponent Uses UserStatusService for Referral Data

The system **MUST** integrate `UserStatusService` into `SocialComponent` to display real referral metrics and enable referral link generation using the user's `referrealId`.

#### Scenario: SocialComponent displays referral count from UserStatusService

- GIVEN the user has loaded status with referral data
- WHEN SocialComponent renders the "Mis Referidos" tab
- THEN the "Total" metric MUST display the value from `UserInfoService.getReferInfo().total`
- AND the "Hoy" metric MUST display the value from `getReferInfo().today`
- AND the "Última semana" metric MUST display the value from `getReferInfo().lastWeek`
- AND the "Último mes" metric MUST display the value from `getReferInfo().lastMonth`

#### Scenario: SocialComponent displays earnings from UserStatusService

- GIVEN the user has loaded status with earnings data
- WHEN SocialComponent renders the "Mis Ganancias" tab
- THEN the "Total" metric MUST display the value from `UserInfoService.getReferInfo().earnTotal`
- AND the "Hoy" metric MUST display the value from `getReferInfo().earnToday`
- AND the "Última semana" metric MUST display the value from `getReferInfo().earnLastWeek`
- AND the "Último mes" metric MUST display the value from `getReferInfo().earnLastMonth`

#### Scenario: SocialComponent generates referral link using referrealId

- GIVEN the user has a populated `referrealId` in UserStatusService
- WHEN the user taps the "Invitar un amigo" button
- THEN the component MUST construct a referral URL containing the `referrealId`
- AND the URL format MUST be: `{baseUrl}?ref={referrealId}`
- AND the URL MUST be copied to clipboard or shared via Web Share API

#### Scenario: SocialComponent handles missing referrealId

- GIVEN the user's `referrealId` is null or empty
- WHEN the user taps the "Invitar un amigo" button
- THEN the component MUST display a toast notification: "No tienes un código de referido"
- AND the share action MUST NOT proceed

#### Scenario: Copy button copies referral link

- GIVEN the user has a valid `referrealId`
- WHEN the user taps the copy button (copy icon)
- THEN the referral URL MUST be copied to the clipboard
- AND a toast notification MUST confirm: "Enlace copiado"

#### Scenario: Referral metrics update reactively

- GIVEN SocialComponent is rendered and displaying referral data
- WHEN UserInfoService fetches updated referral data
- THEN the displayed metrics MUST update automatically
- AND no manual refresh or re-render MUST be required

## MODIFIED Requirements

### Requirement: SocialComponent Tab Content

The system **SHOULD** replace hardcoded `--` placeholders with real data from UserInfoService.

(Previously: All metrics in "Mis Referidos", "Mis Ganancias", and "Detalles" tabs displayed `--` placeholders.)

#### Scenario: Metrics display real values instead of placeholders

- GIVEN referral data is successfully loaded
- WHEN any tab is active
- THEN numeric values MUST be displayed
- AND `--` placeholders MUST only show if data is loading or unavailable

## REMOVED Requirements

None — this change enhances existing UI with real data integration.
