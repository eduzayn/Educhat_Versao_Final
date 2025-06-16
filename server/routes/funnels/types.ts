export interface Funnel {
  id: number;
  teamId: number;
  teamType: string;
  stages: FunnelStage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStage {
  id: number;
  funnelId: number;
  name: string;
  order: number;
  type: string;
  isInitial: boolean;
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStats {
  totalFunnels: number;
  totalDeals: number;
  byTeamType: {
    [key: string]: {
      total: number;
      active: number;
      completed: number;
    };
  };
  byStage: {
    [key: string]: {
      total: number;
      conversionRate: number;
    };
  };
} 