
export interface BibleVerse {
  reference: string;
  text: string;
}

export interface Transaction {
  id: string;
  type: 'CLAIM' | 'STREAK_BONUS' | 'INVITE_REWARD';
  amount: number;
  timestamp: number;
  details?: string;
}

export interface UserStats {
  id: string;
  balance: number;
  streak: number;
  lastClaimDate: number | null;
  totalInvites: number;
  isVerified: boolean;
}

export interface Reflection {
  verse: BibleVerse;
  thought: string;
}
