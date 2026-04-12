# Tasks: Crypto Deposit API Integration

## Phase 1: Foundation & Test Scaffolding

- [x] 1.1 Create `src/app/features/wallet/crypto-deposit-modal.component.spec.ts` with RED tests for confirmation CTA visibility, disclaimer text, loading-disabled state, and inline error rendering.
- [x] 1.2 Create `src/app/features/wallet/transaction/components/deposit-form.component.spec.ts` with RED tests for `cryptoConfigured` behavior when `environment.cryptoDepositAddress` is present/empty.
- [x] 1.3 In `deposit-form.component.spec.ts`, add RED tests for crypto submit flow: calls `WalletService.addDeposit()` with `transactionId: ''` and blocks duplicate submits while `isSubmitting` is true.
- [x] 1.4 In `deposit-form.component.spec.ts`, add RED tests for outcomes: success closes modal + shows pending feedback, failure keeps modal open + exposes retry-capable error state.

## Phase 2: Modal Confirmation UX Implementation

- [x] 2.1 Update `src/app/features/wallet/crypto-deposit-modal.component.ts` to add `confirm = output<{ amount: number; method: string }>()` and `isLoading = input(false)`.
- [x] 2.2 Add `errorMessage` signal/input contract in `crypto-deposit-modal.component.ts` and render recoverable error UI without closing the modal.
- [x] 2.3 Extend modal template in `crypto-deposit-modal.component.ts` with disclaimer text about blockchain/network confirmation and a primary action button "Confirmar que envié los fondos".
- [x] 2.4 Wire the primary action in `crypto-deposit-modal.component.ts` to emit confirm payload, disable while loading, and keep copy-address behavior intact.

## Phase 3: Deposit Form Data Flow & API Wiring

- [x] 3.1 Update `src/app/features/wallet/transaction/components/deposit-form.component.ts` to inject `WalletService` and required auth/token source used by existing wallet requests.
- [x] 3.2 Add `cryptoConfigured` computed and use it to disable/unavailable crypto methods in template with clear reason text when address is missing.
- [x] 3.3 Add `isSubmitting` + modal error state signals in `deposit-form.component.ts`; pass `[isLoading]` and error input to `<app-crypto-deposit-modal>`.
- [x] 3.4 Implement `onCryptoConfirm(amount, method)` in `deposit-form.component.ts`: guard duplicates, set loading, call `walletService.addDeposit({ amountUSD, method, transactionId: '' ... })`.
- [x] 3.5 Implement success/failure handling in `deposit-form.component.ts`: on success close modal + show pending reconciliation message; on error keep modal open, set error message, and re-enable submit.
- [x] 3.6 Keep non-crypto flow unchanged in `onDeposit()` and verify existing payment-screen path is not regressed.

## Phase 4: Integration Verification & Open Questions Closure

- [x] 4.1 Add an API integration-style test in `deposit-form.component.spec.ts` using `HttpClientTestingModule`/`HttpTestingController` (or project-equivalent) to assert POST `/Wallet/addDeposit` payload includes `transactionId: ''`.
- [x] 4.2 Add test assertion that success messaging explicitly indicates pending reconciliation and does not claim immediate credit.
- [x] 4.3 Confirm backend contract for empty `transactionId` with API team and record result in `openspec/changes/feature/crypto-deposit-api-integration/design.md` open-questions section.
- [x] 4.4 Confirm final product copy for "pending reconciliation" messaging and align strings in `deposit-form.component.ts` + modal template.