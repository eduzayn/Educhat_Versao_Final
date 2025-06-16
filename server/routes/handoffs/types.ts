export interface HandoffStats {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  averageResponseTime: number;
  byType: {
    manual: number;
    automatic: number;
    escalation: number;
  };
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
}

export interface TeamCapacity {
  teamId: number;
  teamName: string;
  currentLoad: number;
  maxCapacity: number;
  availableSlots: number;
  averageResponseTime: number;
  successRate: number;
}

export interface IntelligentHandoffStats {
  totalAnalyzed: number;
  handoffsCreated: number;
  accuracy: number;
  averageConfidence: number;
  byType: {
    automatic: number;
    manual: number;
  };
  byUrgency: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  teamPerformance: Array<{
    teamId: number;
    teamName: string;
    successRate: number;
    averageResponseTime: number;
  }>;
} 