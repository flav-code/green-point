export interface User {
  id: string;
  name: string;
  teamId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  joinDate: string;
  stats: UserStats;
  achievements: Achievement[];
}

export interface UserStats {
  totalPrompts: number;
  efficientPrompts: number;
  inefficientPrompts: number;
  averageEnergy: number;
  dailyPrompts: Record<string, number>;
  dailyEnergy: Record<string, number>;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  memberCount: number;
  logo: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  energyUsage?: number;
  efficiency?: 'high' | 'medium' | 'low';
}

export interface EnergyMetrics {
  usage: number;
  efficiency: 'high' | 'medium' | 'low';
  suggestions?: string[];
}