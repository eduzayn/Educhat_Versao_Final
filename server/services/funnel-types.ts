export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  probability?: number;
}

export interface CreateFunnelData {
  name: string;
  teamType: string;
  teamId: number;
  stages: FunnelStage[];
  description?: string;
} 