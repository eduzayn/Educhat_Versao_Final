import { useQuery } from '@tanstack/react-query';
import { AIStats, AILog, TrainingContext, MemoryStats, ProcessedDocument } from './types';

export function useAIStats() {
  return useQuery<AIStats>({
    queryKey: ['/api/ia/stats'],
    queryFn: async () => {
      const response = await fetch('/api/ia/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas');
      return response.json();
    }
  });
}

export function useAILogs() {
  return useQuery<AILog[]>({
    queryKey: ['/api/ia/logs'],
    queryFn: async () => {
      const response = await fetch('/api/ia/logs');
      if (!response.ok) throw new Error('Falha ao carregar logs');
      return response.json();
    }
  });
}

export function useTrainingContexts() {
  return useQuery<TrainingContext[]>({
    queryKey: ['/api/ia/contexts'],
    queryFn: async () => {
      const response = await fetch('/api/ia/contexts');
      if (!response.ok) throw new Error('Falha ao carregar contextos');
      return response.json();
    }
  });
}

export function useMemoryStats() {
  return useQuery<MemoryStats>({
    queryKey: ['/api/ia/memory/stats'],
    queryFn: async () => {
      const response = await fetch('/api/ia/memory/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas de memória');
      return response.json();
    }
  });
}

export function useMemories(memoryFilter: string, selectedConversation: string) {
  return useQuery({
    queryKey: ['/api/ia/memory', memoryFilter, selectedConversation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (memoryFilter) params.append('memoryType', memoryFilter);
      if (selectedConversation) params.append('conversationId', selectedConversation);
      params.append('limit', '100');
      
      const response = await fetch(`/api/ia/memory?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar memórias');
      return response.json();
    }
  });
}

export function useRecentDocuments() {
  return useQuery<ProcessedDocument[]>({
    queryKey: ['/api/documents/recent'],
    queryFn: async () => {
      const response = await fetch('/api/documents/recent?limit=20');
      if (!response.ok) throw new Error('Falha ao carregar documentos');
      return response.json();
    }
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['/api/documents/stats'],
    queryFn: async () => {
      const response = await fetch('/api/documents/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas de documentos');
      return response.json();
    }
  });
} 