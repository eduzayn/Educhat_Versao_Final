export interface HandoffRequest {
  conversationId: number;
  fromUserId?: number;
  toUserId?: number;
  fromTeamId?: number;
  toTeamId?: number;
  type: 'manual' | 'automatic' | 'escalation';
  reason?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  aiClassification?: {
    confidence: number;
    suggestedTeam?: string;
    urgency: string;
    frustrationLevel: number;
    intent: string;
  };
  metadata?: {
    triggerEvent?: string;
    escalationReason?: string;
    customerSentiment?: string;
    previousHandoffs?: number;
  };
}

export interface HandoffCriteria {
  frustrationThreshold: number;
  urgencyLevels: string[];
  confidenceThreshold: number;
  maxHandoffsPerDay: number;
  escalationPatterns: string[];
} 