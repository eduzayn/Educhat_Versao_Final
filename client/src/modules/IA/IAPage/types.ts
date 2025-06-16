export interface AIStats {
  totalInteractions: number;
  successRate: number;
  avgResponseTime: number;
  leadsGenerated: number;
  studentsHelped: number;
  perplexity: number;
  topIntents: Array<{ intent: string; count: number }>;
}

export interface AILog {
  id: number;
  timestamp: string;
  type: string;
  message: string;
  metadata: Record<string, any>;
  processingTime?: number;
  createdAt?: string;
  response?: string;
  classification?: string;
}

export interface TrainingContext {
  id: number;
  name: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStats {
  total: number;
  totalMemories: number;
  activeMemories: number;
  averageRelevance: number;
  topTags: Array<{ tag: string; count: number }>;
  byType: {
    user_info: number;
    context: number;
    preferences: number;
  };
}

export interface Memory {
  id: number;
  content: string;
  relevance: number;
  tags: string[];
  conversationId: string;
  createdAt: string;
}

export interface ProcessedDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  processedAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  processedDocuments: number;
  averageProcessingTime: number;
  documentTypes: Array<{ type: string; count: number }>;
} 