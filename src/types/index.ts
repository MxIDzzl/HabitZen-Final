export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  currentStreak?: number;
  role?: string;
  isVerified?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string;
  streak: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  userId: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  streak: number;
  isOnline: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface SearchUser {
  id: string;
  username: string;
  avatar?: string;
  currentStreak: number;
  isOnline: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  type: 'habit_completed' | 'streak_milestone' | 'achievement';
  message: string;
  timestamp: Date;
  likes: number;
}