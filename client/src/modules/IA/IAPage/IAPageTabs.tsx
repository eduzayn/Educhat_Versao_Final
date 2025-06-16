import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { AIStatsCard } from '@/modules/IA/components/AIStatsCard';
import { MemorySection } from '@/modules/IA/components/MemorySection';
import { DocumentsSection } from '@/modules/IA/components/DocumentsSection';
import { TestSection } from '@/modules/IA/components/TestSection';
import { ContextsSection } from '@/modules/IA/components/ContextsSection';
import { LogsSection } from '@/modules/IA/components/LogsSection';
import { ConfigPage } from '@/modules/IA/ConfigPage';
import { 
  useAIStats, 
  useAILogs, 
  useTrainingContexts, 
  useMemoryStats, 
  useMemories, 
  useRecentDocuments, 
  useDocumentStats 
} from '@/modules/IA/queries';

export function IAPageTabs() {
  const [testMessage, setTestMessage] = useState('');
  const [memoryFilter, setMemoryFilter] = useState('');
  const [selectedConversation, setSelectedConversation] = useState('');

  // Consultas
  const { data: stats, isLoading: statsLoading } = useAIStats();
  const { data: logs, isLoading: logsLoading } = useAILogs();
  const { data: contexts, isLoading: contextsLoading } = useTrainingContexts();
  const { data: memoryStats, isLoading: memoryStatsLoading } = useMemoryStats();
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories(memoryFilter, selectedConversation);
  const { data: recentDocuments, isLoading: documentsLoading } = useRecentDocuments();
  const { data: documentStats, isLoading: documentStatsLoading } = useDocumentStats();

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="memory">Memória Contextual</TabsTrigger>
        <TabsTrigger value="documents">Documentos PDF/DOCX</TabsTrigger>
        <TabsTrigger value="test">Teste da IA</TabsTrigger>
        <TabsTrigger value="contexts">Contextos</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="config">Configurações</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <AIStatsCard stats={stats} isLoading={statsLoading} />
      </TabsContent>

      <TabsContent value="memory" className="space-y-4">
        <MemorySection
          memoryStats={memoryStats}
          memoriesData={memoriesData}
          memoriesLoading={memoriesLoading}
          memoryStatsLoading={memoryStatsLoading}
          memoryFilter={memoryFilter}
          selectedConversation={selectedConversation}
          setMemoryFilter={setMemoryFilter}
          setSelectedConversation={setSelectedConversation}
        />
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <DocumentsSection
          recentDocuments={recentDocuments}
          documentStats={documentStats}
          documentsLoading={documentsLoading}
          documentStatsLoading={documentStatsLoading}
        />
      </TabsContent>

      <TabsContent value="test" className="space-y-4">
        <TestSection
          testMessage={testMessage}
          setTestMessage={setTestMessage}
        />
      </TabsContent>

      <TabsContent value="contexts" className="space-y-4">
        <ContextsSection
          contexts={contexts}
          contextsLoading={contextsLoading}
        />
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <LogsSection
          logs={logs}
          logsLoading={logsLoading}
        />
      </TabsContent>

      <TabsContent value="config" className="space-y-4">
        <ConfigPage />
      </TabsContent>
    </Tabs>
  );
} 