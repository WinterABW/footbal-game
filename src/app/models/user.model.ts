export interface UserStats {
  totalTaps: number;
  hourlyEarning: number;
  referrals: number;
  investments: number;
  achievements: number;
}

export interface AuthResponse {
  id?: number;
  isGuest: boolean;
  token: string;
  username: string;
}

export interface ApiMessageResponse {
  message: string;
}

export interface DepositResponse {
  invoiceUrl?: string;
  txnId?: string;
  orderNumber?: string;
  message: string;
}

export interface ProfileResponse {
  createdAt: string;
  id: number | string;
  isGuest: boolean;
  phone: string | null;
  username: string;
}
