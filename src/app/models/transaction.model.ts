export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'earning' | 'boost_purchase' | 'spin_reward' | 'reward';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method?: string;
  reference: string;
  description?: string;
}

export interface DepositMethod {
  id: number;
  title: string;
  desc: string;
  icon: string;
  type: string;
  countries: string[];
  currencies?: string[];
}

export interface CryptoAddress {
  currency: string;
  network?: string;
  address: string;
  qrCode?: string;
}
