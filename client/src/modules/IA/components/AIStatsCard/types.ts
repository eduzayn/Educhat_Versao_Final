export interface AIStats {
  totalInteractions: number;
  avgResponseTime: number;
  successRate: number;
  leadsGenerated: number;
  studentsHelped: number;
  topIntents: Array<{ intent: string; count: number }>;
}

export interface AIStatsCardProps {
  stats: AIStats | undefined;
  isLoading: boolean;
} 