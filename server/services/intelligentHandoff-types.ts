export interface TeamCapacity {
  teamId: number;
  teamName: string;
  teamType: string;
  activeUsers: number;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  priority: number;
  isActive: boolean;
}

export interface UserAvailability {
  userId: number;
  username: string;
  displayName: string;
  teamId: number;
  currentConversations: number;
  isOnline: boolean;
  lastActivity: Date | null;
  roleCapacity: number;
}

export interface HandoffRecommendation {
  teamId?: number;
  userId?: number;
  confidence: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedWaitTime: number;
  alternativeOptions: Array<{
    teamId?: number;
    userId?: number;
    reason: string;
    confidence: number;
  }>;
}

export interface MessageClassification {
  confidence: number;
  suggestedTeam?: string;
  urgency: string;
  frustrationLevel: number;
  intent: string;
} 