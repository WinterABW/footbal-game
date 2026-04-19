# Proposal: Crypto Deposit Confirmation Modal Guidance Upgrade

## Intent

Improve the post-deposit confirmation modal so users immediately understand the next action. Replace status-heavy copy with instructional guidance and a clear CTA (`Recargar Ahora`) while preserving current invoice-opening behavior and trust-focused Liquid Glass presentation.

## Scope

### In Scope
- Update copy and layout in `deposit-response-modal.component.ts` template.
- Replace current deposit-success text blocks with instructional messaging and three static benefit highlights: `Seguro`, `Rápido`, `Cifrado`.
- Rename primary action from `Ver Factura` to `Recargar Ahora`.
- Preserve existing CTA behavior: open invoice PDF in new tab and keep disabled state when URL is missing.
- Keep `Cerrar` button behavior unchanged and aligned with existing modal interactions.

### Out of Scope
- API payload/contract changes in `wallet.service.ts` or transaction flow services.
- Business-logic changes to deposit creation, invoice generation, or backend status handling.
- New analytics, localization expansion, or design-token refactors.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `ui`: Update modal confirmation UX requirements for crypto deposit response messaging and action labeling.

## Approach

Implement a template-first UI update in the modal component and keep component logic minimal. Reuse existing `openInvoice`/URL guard behavior; only adjust labels/text bindings as needed. Use current Liquid Glass utility classes and spacing/typography conventions to maintain visual consistency and accessibility.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/.../deposit-response-modal.component.ts` | Modified | Update button labels and any static data model used by the template. |
| `src/app/.../deposit-response-modal.component.html` | Modified | Replace content hierarchy, instructional copy, benefits row, and CTA text. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Broken CTA behavior after label/template changes | Low | Preserve current click handler and disabled condition; regression test manually. |
| Visual inconsistency with Liquid Glass system | Low | Reuse existing modal utility classes/tokens only. |
| Copy overflow on smaller screens | Medium | Keep mobile-first spacing and test at narrow widths. |

## Rollback Plan

Revert `deposit-response-modal` template and label changes to previous commit/state, restoring original text (`¡Depósito Enviado!`, `Factura creada exitosamente`, `Ver Factura`) while keeping untouched logic intact.

## Dependencies

- Existing modal invoice URL contract from current transaction/deposit flow.
- Existing Liquid Glass utility classes in global style system.

## Success Criteria

- [ ] Modal displays instructional next-step copy and benefit highlights (`Seguro`, `Rápido`, `Cifrado`).
- [ ] Primary button label is `Recargar Ahora` and still opens PDF invoice in a new tab.
- [ ] Primary button remains disabled when no invoice URL exists.
- [ ] `Cerrar` button behavior is unchanged.
- [ ] Updated modal remains visually consistent with Liquid Glass design system on mobile and desktop.
