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
