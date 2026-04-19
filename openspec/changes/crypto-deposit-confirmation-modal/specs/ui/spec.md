# Delta for UI

## ADDED Requirements

### Requirement: Crypto Deposit Confirmation Modal Content

The system MUST display an instructional message and benefit highlights on the crypto deposit confirmation modal instead of standard success text.

#### Scenario: User views the crypto deposit confirmation modal
- GIVEN a crypto deposit transaction has been successfully processed
- WHEN the deposit response modal is displayed
- THEN it MUST display the exact message: "✅️ Precione el botón, siga los pasos a continuación y realice la recarga a través de nuestro API oficial."
- AND it MUST display three benefit highlights: "🟢 🔐 Seguro", "🟢 ⏩️ Rápido", "🟢 📚 Cifrado"
- AND the content MUST adhere to the existing Liquid Glass design system (colors, blur, borders, shadows, animations).

### Requirement: Crypto Deposit Confirmation Actions

The system MUST provide a primary action to view the invoice (labeled "Recargar Ahora") and a secondary action to close the modal.

#### Scenario: User clicks "Recargar Ahora"
- GIVEN the crypto deposit confirmation modal is displayed
- AND a valid invoice URL exists
- WHEN the user clicks "🔴 Recargar Ahora"
- THEN the system MUST open the invoice PDF in a new tab.

#### Scenario: Invoice URL is missing
- GIVEN the crypto deposit confirmation modal is displayed
- AND no valid invoice URL exists
- THEN the "🔴 Recargar Ahora" button MUST be disabled.

#### Scenario: User clicks "Cerrar"
- GIVEN the crypto deposit confirmation modal is displayed
- WHEN the user clicks the "Cerrar" button
- THEN the modal MUST close
- AND the system MUST execute the existing behavior (e.g., navigating to `/wallet` after a delay).
