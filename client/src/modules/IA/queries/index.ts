import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { AIStats, AILog, TrainingContext, MemoryStats, Memory, ProcessedDocument, DocumentStats } from '../IAPage/types';

// Hook para estatísticas da IA
export function useAIStats() {
  return useQuery<AIStats>({
    queryKey: ['/api/ia/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/stats');
      return response.json();
    },
  });
}

// Hook para logs da IA
export function useAILogs() {
  return useQuery<AILog[]>({
    queryKey: ['/api/ia/logs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/logs');
      return response.json();
    },
  });
}

// Hook para contextos de treinamento
export function useTrainingContexts() {
  return useQuery<TrainingContext[]>({
    queryKey: ['/api/ia/contexts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/contexts');
      return response.json();
    },
  });
}

// Hook para estatísticas de memória
export function useMemoryStats() {
  return useQuery<MemoryStats>({
    queryKey: ['/api/ia/memory/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/memory/stats');
      return response.json();
    },
  });
}

// Hook para memórias
export function useMemories(filter: string, conversationId: string) {
  return useQuery<Memory[]>({
    queryKey: ['/api/ia/memory', filter, conversationId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ia/memory?filter=${filter}&conversationId=${conversationId}`);
      return response.json();
    },
  });
}

// Hook para documentos recentes
export function useRecentDocuments() {
  return useQuery<ProcessedDocument[]>({
    queryKey: ['/api/ia/documents/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/documents/recent');
      return response.json();
    },
  });
}

// Hook para estatísticas de documentos
export function useDocumentStats() {
  return useQuery<DocumentStats>({
    queryKey: ['/api/ia/documents/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ia/documents/stats');
      return response.json();
    },
  });
} 