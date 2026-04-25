export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'earning' | 'boost_purchase' | 'spin_reward' | 'reward';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method?: string;
  methodId?: number; // Numeric method ID from backend (0-8 for deposits, 0-11 for withdrawals)
  reference: string;
  description?: string;
  conversionToCOP?: number;
}

// Method ID mappings - DEPOSIT vs WITHDRAWAL use different ID systems!
// DEPOSIT IDs (FinanceMethod enum from wallet.service.ts in core)
export enum DepositMethodId {
  CRYPTO = 0,      // 0 → Crypto
  NEQUI_1 = 1,     // 1 → Nequi 1
  NEQUI_2 = 2,     // 2 → Nequi 2
  NEQUI_3 = 3,     // 3 → Nequi 3
  DAVIPLATA = 4,   // 4 → Daviplata
  PAYPAL = 5,      // 5 → PayPal
  BRE_B = 6,       // 6 → BRE-B
  PLIN = 7,        // 7 → Plin
  YAPE = 8,        // 8 → Yape
}

// WITHDRAWAL IDs (methodId from withdraw-form.component.ts)
export enum WithdrawMethodId {
  NEQUI_1 = 0,      // 0 → Nequi 1
  NEQUI_2 = 1,      // 1 → Nequi 2
  NEQUI_3 = 2,      // 2 → Nequi 3
  DAVIPLATA = 3,    // 3 → Daviplata
  PAYPAL = 4,       // 4 → PayPal
  USDT_TRC20 = 5,   // 5 → USDT TRC20
  USDT_BEP20 = 6,   // 6 → USDT BEP20
  TRX = 7,          // 7 → TRX
  BNB = 8,          // 8 → BNB
  BTC = 9,          // 9 → BTC
  PLIN = 10,        // 10 → Plin
  YAPE = 11,        // 11 → Yape
}
