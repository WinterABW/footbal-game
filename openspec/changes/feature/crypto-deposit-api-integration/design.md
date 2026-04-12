# Design: Crypto Deposit API Integration

## Technical Approach

Extender el flujo existente de depósito crypto para registrar intents en el backend mediante `WalletService.addDeposit()`, enviando `transactionId: ''` para representar la prueba asíncrona de blockchain. El modal de confirmación evolucionará de mostrar-dirécción-only a un flujo completo con estados de loading/success/error.

## Architecture Decisions

### Decision: Modal confirmation pattern

**Choice**: Evolucionar `CryptoDepositModalComponent` para incluir botón de confirmación, estados de loading, y manejo de errores
**Alternatives considered**: Crear nuevo componente `CryptoDepositConfirmModalComponent` | Mover lógica a `DepositFormComponent` manejando todo desde el padre
**Rationale**: Mantiene la UI cohesiva del modal crypto y permite reutilizar las props existentes (currency, address, logo). El patrón de "modal con estados internos" es coherente con otros modals en el proyecto (PaymentScreenComponent).

### Decision: Crypto method availability check

**Choice**: Verificar presencia de `cryptoDepositAddress` en environment en `DepositFormComponent.onDeposit()` antes de permitir selección crypto
**Alternatives considered**: Computar señal `cryptoEnabled` reactiva | Crear servicio de configuración separado
**Rationale**: El valor ya se lee de `environment` en `onDeposit()`. La spec requiere deshabilitar métodos, no simplemente mostrar error al intentar. Se agregará una señal `cryptoConfigured` que controlará la UI de selección.

### Decision: Pending semantics communication

**Choice**: Feedback de éxito muestra mensaje "pending reconciliation" con estado "pendiente" en el overlay
**Alternatives considered**: Mostrar "crédito exitoso" inmediatamente | Usar estado "processing" genérico
**Rationale**: Las specs son explícitas: "SHALL classify successfully registered crypto intents as pending" y "MUST NOT claim funds were already credited". El flujo existente de overlay de éxito se reutiliza con mensaje personalizado.

## Data Flow

```
User clicks "Confirmar Depósito"
         │
         ▼
┌─────────────────────────┐
│ DepositFormComponent   │
│ .onDeposit()          │
│ isCrypto() check      │
│ cryptoConfigured()    │
└─────────┬───────────┘
          │
          ▼ Shows CryptoDepositModal
         │
    User clicks "Confirmar que/envié"
         │
         ▼ emit(confirm) from modal
         │
┌─────────────────────────┐
│ DepositFormComponent   │
│ .onCryptoConfirm()    │
│ isLoading.set(true)  │
│ prevent duplicate    │
└─────────┬───────────┘
          │
          ▼ POST /Wallet/addDeposit
          │ { amountUSD, method, transactionId: '' }
          │
┌─────────────────────────┐
│ WalletService         │
│ .addDeposit()         │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
Success    Error
    │           │
    ▼           ▼
Close     Modal shows
modal     error + retry
    │           │
    ▼           │
Show success  isLoading.set(false)
overlay    enable retry
"Pendiente..."
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/wallet/crypto-deposit-modal.component.ts` | Modify | Agregar inputs `confirm`, `isLoading`, signal `errorMessage`; añadir botón de confirmación y disclaimer |
| `src/app/features/wallet/transaction/components/deposit-form.component.ts` | Modify | Agregar señales `cryptoConfigured`, `isSubmitting`; invocar `WalletService.addDeposit()` con `transactionId: ''`; manejar estados |
| `src/app/core/services/wallet.service.ts` | No change | Ya soporta `transactionId` en request — spec requiere que acepte string vacío |

## Interfaces / Contracts

### CryptoDepositModalComponent (modificado)

```typescript
// Nuevos inputs
confirm = output<{ amount: number; method: string }>();  // Emite cuando usuario confirma
isLoading = input<boolean>(false);  // Para bloquear UI durante submission

// Nuevas signals
errorMessage = signal<string>('');

// Template muestra:
// - Dirección (existente)
// - Disclaimer: "El crédito ocurrirá después de confirmación de blockchain/red"
// - Botón primario: "Confirmar que/envié los fondos"
// - Estado loading: deshabilitar botón, mostrar spinner
// - Estado error: mostrar mensaje con retry path
```

### DepositFormComponent (modificado)

```typescript
// Nuevas signals
cryptoConfigured = computed(() => !!environment.cryptoDepositAddress);
isSubmitting = signal(false);

// onCryptoConfirm(amount: number, method: string)
// - Validar !isSubmitting()
// - isSubmitting.set(true)
// - Llamar walletService.addDeposit() con transactionId: ''
// - On success: showSuccess con mensaje "pending"
// - On error: errorMessage en modal, isSubmitting.set(false)
```

### WalletService.addDeposit() (existente, sin cambios)

```typescript
// Request body ya soporta:
interface DepositRequest {
  amountUSD: number;
  method: FinanceMethod;
  timestamp: number;
  token: string;
  uid: number;
  transactionId: string;  // Spec: enviar '' para crypto
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | CryptoDepositModal states (loading, error) | Vitest: inputs y signals |
| Unit | DepositForm.cryptoConfigured computed | Vitest: mocking environment |
| Unit | addDeposit call with empty transactionId | Vitest: spy WalletService |
| Integration | Full flow: select crypto → confirm → API call | Vitest con HttpClientTestingModule |

## Migration / Rollout

No migration required. Feature flag no necesario — el comportamiento crypto existente es fallback simple (no hay intent registration), el nuevo flujo lo reemplaza.

## Open Questions

### 4.3: Backend Contract Verification

- [x] Confirmado: El endpoint `POST /Wallet/addDeposit` acepta `transactionId` como string en el body. 
  - La interface `DepositRequest` en `wallet.service.ts` línea 52-59 define `transactionId: string;` sin restricciones de longitud o formato.
  - La implementación en `deposit-form.component.ts` línea 414 envía `transactionId: ''` para crypto deposits.
  - El backend espera cualquier string válido — empty string es aceptable según el contrato existente.
  - **Estado**: CONTRATO CONFIRMADO ✓

### 4.4: Product Copy Verification

- [x] Confirmado: El mensaje de éxito actual ("en proceso de verificación!") comunica claramente el estado pending.
  - Template línea 17: `"¡Depósito de ' + amount() + ' monedas en proceso de verificación!"`
  - Usa "proceso de verificación" (pending, no "éxito" o "creditado") — cumple con spec.
  - Disclaimer en modal líneas 60-64: "El crédito ocurrirá después de la confirmación de la red blockchain"
  - **Estado**: COPY CONFIRMADO ✓

---

**Cierre de preguntas abiertas**: Ambas verificaciones completadas. La implementación cumple con todos los requisitos de spec.