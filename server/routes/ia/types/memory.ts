export interface IAMemory {
  id: number;
  conversationId: number;
  contactId: number;
  memoryType: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contactName?: string;
}

export interface IAMemoryStats {
  byType: Record<string, number>;
  total: number;
}

export interface IAMemoryPagination {
  page: number;
  limit: number;
  total: number;
}

export interface IAMemoryListResponse {
  memories: IAMemory[];
  pagination: IAMemoryPagination;
}

export interface IAMemorySearchResponse {
  memories: IAMemory[];
}

export interface IAMemoryConversationResponse {
  memories: IAMemory[];
} 