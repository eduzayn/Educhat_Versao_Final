import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import { Brain, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Import dos componentes refatorados
import { AIStatsCard } from './components/AIStatsCard/AIStatsCard';
import { MemorySection } from './components/MemorySection';
import { DocumentsSection } from './components/DocumentsSection';
import { TestSection } from './components/TestSection';
import { ContextsSection } from './components/ContextsSection';
import { LogsSection } from './components/LogsSection';
import { ConfigPage } from './ConfigPage';
import { IAPageHeader } from './components/IAPageHeader';
import { IAPageTabs } from './components/IAPageTabs';

interface AIStats {
  totalInteractions: number;
  avgResponseTime: number;
  successRate: number;
  leadsGenerated: number;
  studentsHelped: number;
  topIntents: Array<{ intent: string; count: number }>;
}

interface AILog {
  id: number;
  message: string;
  classification: {
    intent: string;
    sentiment: string;
    confidence: number;
    aiMode: string;
  };
  response: string;
  processingTime: number;
  createdAt: string;
}

interface TrainingContext {
  id: number;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface MemoryStats {
  byType: Record<string, number>;
  total: number;
}

interface ProcessedDocument {
  id: number;
  name: string;
  type: string;
  content: string;
  metadata: any;
  createdAt: string;
}

export default function IAPage() {
  const [, setLocation] = useLocation();
  const [testMessage, setTestMessage] = useState('');
  const [memoryFilter, setMemoryFilter] = useState('');
  const [selectedConversation, setSelectedConversation] = useState('');

  // Consultas principais
  const { data: stats, isLoading: statsLoading } = useQuery<AIStats>({
    queryKey: ['/api/ia/stats'],
    queryFn: async () => {
      const response = await fetch('/api/ia/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas');
      return response.json();
    }
  });

  const { data: logs, isLoading: logsLoading } = useQuery<AILog[]>({
    queryKey: ['/api/ia/logs'],
    queryFn: async () => {
      const response = await fetch('/api/ia/logs');
      if (!response.ok) throw new Error('Falha ao carregar logs');
      return response.json();
    }
  });

  const { data: contexts, isLoading: contextsLoading } = useQuery<TrainingContext[]>({
    queryKey: ['/api/ia/contexts'],
    queryFn: async () => {
      const response = await fetch('/api/ia/contexts');
      if (!response.ok) throw new Error('Falha ao carregar contextos');
      return response.json();
    }
  });

  // Consultas para memória contextual
  const { data: memoryStats, isLoading: memoryStatsLoading } = useQuery<MemoryStats>({
    queryKey: ['/api/ia/memory/stats'],
    queryFn: async () => {
      const response = await fetch('/api/ia/memory/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas de memória');
      return response.json();
    }
  });

  const { data: memoriesData, isLoading: memoriesLoading } = useQuery({
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

  // Consultas para documentos
  const { data: recentDocuments, isLoading: documentsLoading } = useQuery<ProcessedDocument[]>({
    queryKey: ['/api/documents/recent'],
    queryFn: async () => {
      const response = await fetch('/api/documents/recent?limit=20');
      if (!response.ok) throw new Error('Falha ao carregar documentos');
      return response.json();
    }
  });

  const { data: documentStats, isLoading: documentStatsLoading } = useQuery({
    queryKey: ['/api/documents/stats'],
    queryFn: async () => {
      const response = await fetch('/api/documents/stats');
      if (!response.ok) throw new Error('Falha ao carregar estatísticas de documentos');
      return response.json();
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <IAPageHeader />
        <IAPageTabs />
      </div>
    </div>
  );
}