export interface Team {
  id: number;
  name: string;
  teamType: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  leaderId?: number;
} 