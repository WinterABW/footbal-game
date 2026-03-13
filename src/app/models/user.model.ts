export interface UserProfile {
  id: number;
  username: string;
  email: string;
  balance: number;
  totalEarnings: number;
  level: number;
  joinedAt: string;
  status: 'active' | 'inactive' | 'banned';
  avatar?: string;
}

export interface UserStats {
  totalTaps: number;
  hourlyEarning: number;
  referrals: number;
  investments: number;
  achievements: number;
}
