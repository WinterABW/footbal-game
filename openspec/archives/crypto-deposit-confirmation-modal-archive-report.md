# Archive Report: Crypto Deposit Confirmation Modal

## Background

**Change Name**: Crypto Deposit Confirmation Modal

The intent was to upgrade the post-deposit confirmation modal by enhancing instructional clarity and updating the call-to-action behavior without modifying the underlying business logic. The change aimed to:
- Replace success text with user guidance.
- Adhere visually to the Liquid Glass design system.

## Context for Archiving

This change received a **FAIL** verdict under STRICT TDD criteria. Critical issues that led to the failure included:

1. **Test Infrastructure:** Tests for the modal component were incompatible with Angular’s injection context in version 21+.
    - Specifically, the NG0203 error blocked execution of behavior-related tests.
    - Test instantiation methods (direct `new DepositResponseModalComponent()` usage) are obsolete; injection-context-based setups are necessary.
    - Behavioral tests were either missing or unable to run successfully.

2. **Accessiblity Gaps:**
    - Absence of ARIA modal attributes (`role="dialog"`, `aria-modal="true"`, etc.).
    - Focus management (focus trap) implementation was incomplete.
    - Disabled contrast ratios not validated or ensured to meet WCAG-AA compliance.

3. **Acceptance Tests Failures:** Implementation lacked verified runtime evidence proving compliance via behavioral tests:
    - Actions like the primary CTA opening an invoice or a disabled state assertion were not runtime-proven.

## User Decision

Despite the blocker-level failures under Strict TDD, the user explicitly instructed to **archive the change** due to project timelines and the clear intent to pivot future work rather than retry the same foundation.

The rationale provided emphasized clear alignment with project priorities over strict process adherence. Incomplete scenarios will be addressed re-prioritized with enhanced planning.

## Legacy Reference Plan

### Artifacts Preserved

Changes are outlined in the following existing documents for reference:
- Proposal: openspec/changes/crypto-deposit-confirmation-modal/proposal.md
- Verification Report: openspec/changes/crypto-deposit-confirmation-modal/verify-report.md

Proven gaps (structurally implemented but unverified at runtime) include:
- Static compliance with Liquid Glass Design System.
- Correct instructional text and benefit highlights rendered prior to TDD-verified completion.
- Legacy non-break specific summary in Angular pieces interoperability.

## Archive Commitments