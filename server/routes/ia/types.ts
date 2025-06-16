export interface IAStats {
  totalInteractions: number;
  leadsConverted: number;
  avgResponseTime: number;
  successRate: number;
  studentsHelped: number;
  topIntents: Array<{
    intent: string;
    count: number;
  }>;
}

export interface IALog {
  id: number;
  message: string;
  response: string;
  classification: string;
  processingTime: number;
  createdAt: Date;
}

export interface IATestResponse {
  message: string;
  classification: string;
}

export interface IAContext {
  id: number;
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadTrainingResponse {
  success: boolean;
  message: string;
  contexts: IAContext[];
} 