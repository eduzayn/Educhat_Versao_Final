import type { Memory, MemoryStats } from '../../IAPage/types';

export type { Memory, MemoryStats };

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

export interface MemorySectionProps {
  memoryStats: MemoryStats | undefined;
  memoriesData: Memory[] | undefined;
  memoriesLoading: boolean;
  memoryStatsLoading: boolean;
  memoryFilter: string;
  selectedConversation: string;
  setMemoryFilter: (filter: string) => void;
  setSelectedConversation: (conversation: string) => void;
} 