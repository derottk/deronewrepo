export interface User {
  uid: string;
  firstName: string;
  photoUrl?: string;
  balance: number;
  totalAdsWatched: number;
  totalBirrEarned: number;
  totalTasksCompleted: number;
  inviteCount: number;
  referrerUid?: string;
  language: 'en' | 'am';
  isBanned: boolean;
  lastAdWatchedAt?: string;
  adsWatchedToday: number;
  lastDailyResetAt?: string;
  createdAt: string;
  role?: 'admin' | 'user';
}

export interface AdConfig {
  rewardPerAd: number;
  dailyLimit: number;
  cooldownSeconds: number;
  minWithdrawal: number;
  maxWithdrawal: number;
}

export interface WithdrawalRequest {
  id?: string;
  uid: string;
  firstName: string;
  bank: string;
  accountName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'channel' | 'group';
  link: string;
  reward: number;
  isActive: boolean;
}

export interface UserTask {
  uid: string;
  taskId: string;
  status: 'completed';
  completedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  reward: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  milestoneType: 'ads' | 'earnings' | 'invites';
  milestoneValue: number;
  badgeUrl?: string;
}
