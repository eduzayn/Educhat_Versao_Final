export interface AIMemory {
  id: number;
  conversationId: number;
  contactId: number;
  memoryType: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  contactName?: string;
}

export interface MemoryStats {
  byType: Record<string, number>;
  total: number;
}

export interface MemorySectionProps {
  memoryStats: MemoryStats | undefined;
  memoriesData: any;
  memoriesLoading: boolean;
  memoryStatsLoading: boolean;
  memoryFilter: string;
  selectedConversation: string;
  setMemoryFilter: (filter: string) => void;
  setSelectedConversation: (conversation: string) => void;
} 