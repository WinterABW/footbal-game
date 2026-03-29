export type MotionEventType = 'missionClaimed' | 'missionFailed' | 'dailyRewardCollected';

export interface MotionEvent {
  type: MotionEventType;
  missionId?: number;
  amount?: number;
  error?: string;
}