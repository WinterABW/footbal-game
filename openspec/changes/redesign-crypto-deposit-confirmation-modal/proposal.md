# Proposal: Crypto Deposit Confirmation Modal Redesign

## Intent

Transform the post-deposit modal into a proactive guidance step that tells users exactly what to do next (“realice la recarga a través de nuestro API oficial”) while preserving trust and conversion. The redesign emphasizes clarity and confidence through explicit CTA copy and visible process benefits (“Seguro”, “Rápido”, “Cifrado”).

## Scope

### In Scope
- Redesign modal content in `src/app/features/wallet/transaction/components/deposit-response-modal.component.ts` (inline template).
- Replace current success/invoice-detail messaging with instructional copy and three benefit highlights.
- Rename primary invoice action label from **“Ver Factura”** to **“Recargar Ahora”** (enabled/disabled behavior unchanged).
- Keep **“Cerrar”** action and close event flow unchanged.
- Keep Liquid Glass visual language and accessibility/focus patterns consistent with existing system.

### Out of Scope
- No API/service/transaction flow changes (`wallet.service.ts`, `transaction.component.ts`).
- No change to invoice URL generation, transaction payload, or backend contract.
- No additional analytics/event tracking in this change.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `ui`: Deposit confirmation modal copy hierarchy and CTA labeling requirements are updated to instructional guidance with benefit emphasis, while preserving existing action behavior.

## Approach

Update only the component template (and minimal TS constants if needed) to:
1) introduce instructional heading/body text, 2) add static benefit badges/items (“Seguro”, “Rápido”, “Cifrado”), and 3) relabel the invoice action to “Recargar Ahora.” Reuse existing `invoiceUrl()` conditional rendering and anchor behavior (`target="_blank"`) so functional flow remains identical.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/features/wallet/transaction/components/deposit-response-modal.component.ts` | Modified | Inline template copy/layout update, CTA label change, benefit highlights rendering; no behavior change for close/open-invoice logic. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CTA semantics may feel inconsistent if it still opens invoice PDF | Medium | Keep behavior explicit in supporting text and preserve disabled state when URL is missing. |
| Visual regressions against Liquid Glass style | Low | Reuse existing glass classes, spacing scale, and focus/interaction tokens. |

## Rollback Plan

Revert `deposit-response-modal.component.ts` to previous template copy and button labels. Since no service/API changes are introduced, rollback is a single-file revert with no data migration or compatibility impact.

## Dependencies

- Existing Liquid Glass utilities and modal interaction patterns already present in the codebase.

## Success Criteria

- [ ] Modal displays new instructional text and benefit highlights (“Seguro”, “Rápido”, “Cifrado”).
- [ ] Primary action reads “Recargar Ahora” and still opens invoice PDF in a new tab only when `invoiceUrl()` exists.
- [ ] “Cerrar” keeps existing close behavior.
- [ ] No regression in modal accessibility/focus visibility and Liquid Glass visual consistency.
