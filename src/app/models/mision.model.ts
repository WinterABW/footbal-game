export interface BackendMission {
  id: number;
  category: string | number | null;
  misionInfo: string;
  misionReward: number;
  created: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  currency: string;
  icon: string;
  completed: boolean;
  category?: string | null;
}