import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import { Brain, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Import dos componentes refatorados
import { AIStatsCard } from './components/AIStatsCard';
import { MemorySection } from './components/MemorySection';
import { DocumentsSection } from './components/DocumentsSection';
import { TestSection } from './components/TestSection';
import { ContextsSection } from './components/ContextsSection';
import { LogsSection } from './components/LogsSection';

// Interfaces movidas para os componentes individuais

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

  // Mutações
  const testAIMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ia/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Falha no teste da IA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    }
  });

  const addContextMutation = useMutation({
    mutationFn: async (context: { title: string; content: string; category: string }) => {
      const response = await fetch('/api/ia/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });
      if (!response.ok) throw new Error('Falha ao adicionar contexto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/contexts'] });
      setNewContext({ title: '', content: '', category: '' });
      setNewQA({ question: '', answer: '', category: '' });
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Falha no upload do documento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
      setSelectedFile(null);
      setUploadProgress(0);
    }
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ia/logs', { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao limpar logs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    }
  });

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    testAIMutation.mutate(testMessage);
    setTestMessage('');
  };

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contextMode === 'content') {
      if (!newContext.title || !newContext.content || !newContext.category) return;
      addContextMutation.mutate(newContext);
    } else {
      if (!newQA.question || !newQA.answer || !newQA.category) return;
      // Convert Q&A to context format
      const qaContext = {
        title: `FAQ: ${newQA.question}`,
        content: `Pergunta: ${newQA.question}\n\nResposta: ${newQA.answer}`,
        category: newQA.category
      };
      addContextMutation.mutate(qaContext);
    }
  };

  const handleClearLogs = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      clearLogsMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Prof. Ana - IA Educacional</h1>
              <p className="text-muted-foreground">
                Sistema inteligente de atendimento educacional com personalidades adaptáveis
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Button>
        </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="memory">Memória Contextual</TabsTrigger>
          <TabsTrigger value="documents">Documentos PDF/DOCX</TabsTrigger>
          <TabsTrigger value="test">Teste da IA</TabsTrigger>
          <TabsTrigger value="contexts">Contextos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalInteractions || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Perplexity AI</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
                    <span className="text-sm font-medium">Ativo</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.leadsGenerated || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alunos Atendidos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.studentsHelped || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Principais Intenções</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.topIntents?.slice(0, 3).map((intent, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{intent.intent}</span>
                        <Badge variant="secondary">{intent.count}</Badge>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          {/* Estatísticas de Memória */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Memórias</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memoryStats?.total || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Info Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memoryStats?.byType?.user_info || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contextos</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memoryStats?.byType?.context || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preferências</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memoryStats?.byType?.preferences || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Memória</CardTitle>
              <CardDescription>
                Filtre as memórias contextuais por tipo ou conversa específica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Tipo de Memória</label>
                  <select
                    value={memoryFilter}
                    onChange={(e) => setMemoryFilter(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="user_info">Informações do Usuário</option>
                    <option value="preferences">Preferências</option>
                    <option value="context">Contexto</option>
                    <option value="history">Histórico</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">ID da Conversa</label>
                  <Input
                    placeholder="Ex: 2017"
                    value={selectedConversation}
                    onChange={(e) => setSelectedConversation(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMemoryFilter('');
                      setSelectedConversation('');
                    }}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Memórias */}
          <Card>
            <CardHeader>
              <CardTitle>Memórias Contextuais da Prof. Ana</CardTitle>
              <CardDescription>
                Visualize todas as informações que a IA está salvando sobre usuários e contextos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : memoriesData?.memories?.length > 0 ? (
                <div className="space-y-4">
                  {memoriesData.memories.map((memory: AIMemory) => (
                    <div key={memory.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            memory.memoryType === 'user_info' ? 'default' :
                            memory.memoryType === 'preferences' ? 'secondary' :
                            memory.memoryType === 'context' ? 'outline' : 'destructive'
                          }>
                            {memory.memoryType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Conversa {memory.conversationId}
                          </span>
                          {memory.contactName && (
                            <span className="text-sm font-medium">
                              - {memory.contactName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {memory.confidence}% confiança
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(memory.updatedAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <div>
                          <span className="text-sm font-medium">Chave:</span>
                          <span className="text-sm ml-2">{memory.key}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Valor:</span>
                          <span className="text-sm ml-2">{memory.value}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Origem: {memory.source} | Criado: {new Date(memory.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {memoriesData.pagination && (
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        Página {memoriesData.pagination.page} de {memoriesData.pagination.pages} 
                        ({memoriesData.pagination.total} total)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma memória encontrada</h3>
                  <p className="text-muted-foreground">
                    A Prof. Ana ainda não salvou memórias com os filtros selecionados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {documentStatsLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{documentStats?.totalDocuments || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processados Hoje</CardTitle>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{documentStats?.processedToday || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conhecimento Adicionado</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{documentStats?.knowledgeItems || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{documentStats?.successRate || 0}%</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload de Documento</CardTitle>
              <CardDescription>
                Faça upload de arquivos PDF ou DOCX para expandir o conhecimento da Prof. Ana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="document-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-gray-500">PDF ou DOCX (MAX. 10MB)</p>
                  </div>
                  <input 
                    id="document-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => uploadDocumentMutation.mutate(selectedFile)}
                      disabled={uploadDocumentMutation.isPending}
                    >
                      {uploadDocumentMutation.isPending ? 'Processando...' : 'Processar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Documentos Processados</CardTitle>
                  <CardDescription>Histórico de documentos processados pela Prof. Ana</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar documentos..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : recentDocuments && recentDocuments.length > 0 ? (
                <div className="space-y-4">
                  {recentDocuments
                    .filter(doc => 
                      !documentSearch || 
                      doc.name.toLowerCase().includes(documentSearch.toLowerCase()) ||
                      doc.content.toLowerCase().includes(documentSearch.toLowerCase())
                    )
                    .map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <FileText className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {doc.type.toUpperCase()} • {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-md">
                          {doc.content.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="secondary">
                          {doc.metadata?.category || 'Geral'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum documento processado</h3>
                  <p className="text-muted-foreground">
                    Faça upload de documentos PDF ou DOCX para começar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste da Prof. Ana</CardTitle>
              <CardDescription>
                Envie uma mensagem para testar o sistema de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestSubmit} className="space-y-4">
                <Textarea
                  placeholder="Digite sua mensagem de teste aqui..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  type="submit" 
                  disabled={testAIMutation.isPending || !testMessage.trim()}
                >
                  {testAIMutation.isPending ? 'Processando...' : 'Testar IA'}
                </Button>
              </form>

              {testAIMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Resposta da IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Classificação:</strong>
                      <div className="ml-4 mt-1 space-y-1">
                        <p><strong>Intenção:</strong> {testAIMutation.data.classification?.intent}</p>
                        <p><strong>Sentimento:</strong> {testAIMutation.data.classification?.sentiment}</p>
                        <p><strong>Confiança:</strong> {testAIMutation.data.classification?.confidence}%</p>
                        <p><strong>Modo IA:</strong> {testAIMutation.data.classification?.aiMode}</p>
                      </div>
                    </div>
                    <div>
                      <strong>Resposta:</strong>
                      <p className="mt-1 p-3 bg-muted rounded">{testAIMutation.data.message}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contexts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Contexto de Treinamento</CardTitle>
              <CardDescription>
                Escolha o formato mais adequado para treinar a Prof. Ana
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mode Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Formato do Conteúdo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${contextMode === 'content' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setContextMode('content')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Conteúdo Livre</h4>
                          <p className="text-sm text-muted-foreground">Informações gerais, políticas, processos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all ${contextMode === 'qa' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setContextMode('qa')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-medium">Pergunta & Resposta</h4>
                          <p className="text-sm text-muted-foreground">FAQ, dúvidas específicas, exemplos práticos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Educational explanation based on selected mode */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                {contextMode === 'content' ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">📋 Conteúdo Livre - Ideal Para:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Políticas institucionais:</strong> regras de matrícula, cancelamento, reembolso</li>
                      <li>• <strong>Processos detalhados:</strong> como se inscrever, documentos necessários</li>
                      <li>• <strong>Informações gerais:</strong> sobre cursos, metodologia, certificações</li>
                      <li>• <strong>Contexto institucional:</strong> história, missão, diferenciais</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">❓ Pergunta & Resposta - Ideal Para:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>FAQ específicas:</strong> "Quanto custa?", "Tem certificado?"</li>
                      <li>• <strong>Objeções comuns:</strong> "É muito caro", "Não tenho tempo"</li>
                      <li>• <strong>Dúvidas técnicas:</strong> sobre plataforma, acesso, suporte</li>
                      <li>• <strong>Cenários práticos:</strong> situações reais de atendimento</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Form based on selected mode */}
              <form onSubmit={handleContextSubmit} className="space-y-4">
                {contextMode === 'content' ? (
                  <>
                    <Input
                      placeholder="Título do contexto"
                      value={newContext.title}
                      onChange={(e) => setNewContext(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Input
                      placeholder="Categoria (ex: cursos, suporte, vendas)"
                      value={newContext.category}
                      onChange={(e) => setNewContext(prev => ({ ...prev, category: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Conteúdo do contexto - Adicione informações detalhadas que a Prof. Ana deve conhecer sobre este tópico..."
                      value={newContext.content}
                      onChange={(e) => setNewContext(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[120px]"
                    />
                    <Button 
                      type="submit" 
                      disabled={addContextMutation.isPending || !newContext.title || !newContext.content || !newContext.category}
                      className="w-full"
                    >
                      {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Contexto'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder="Categoria (ex: cursos, suporte, vendas)"
                      value={newQA.category}
                      onChange={(e) => setNewQA(prev => ({ ...prev, category: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Digite a pergunta que os alunos costumam fazer..."
                      value={newQA.question}
                      onChange={(e) => setNewQA(prev => ({ ...prev, question: e.target.value }))}
                      className="min-h-[80px]"
                    />
                    <Textarea
                      placeholder="Digite a resposta que a Prof. Ana deve dar para esta pergunta..."
                      value={newQA.answer}
                      onChange={(e) => setNewQA(prev => ({ ...prev, answer: e.target.value }))}
                      className="min-h-[120px]"
                    />
                    <Button 
                      type="submit" 
                      disabled={addContextMutation.isPending || !newQA.question || !newQA.answer || !newQA.category}
                      className="w-full"
                    >
                      {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Pergunta & Resposta'}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contextos de Treinamento</CardTitle>
            </CardHeader>
            <CardContent>
              {contextsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {contexts?.map((context) => (
                    <Card key={context.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{context.title}</CardTitle>
                          <Badge variant={context.isActive ? "default" : "secondary"}>
                            {context.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <Badge variant="outline">{context.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{context.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Criado em: {new Date(context.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                  )) || <p className="text-muted-foreground">Nenhum contexto encontrado</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Logs de Interações</h2>
            <Button 
              variant="destructive" 
              onClick={handleClearLogs}
              disabled={clearLogsMutation.isPending}
            >
              {clearLogsMutation.isPending ? 'Limpando...' : 'Limpar Logs'}
            </Button>
          </div>

          {logsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {logs?.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Interação #{log.id}</CardTitle>
                      <div className="flex gap-2">
                        <Badge>{log.classification.intent}</Badge>
                        <Badge variant="outline">{log.classification.sentiment}</Badge>
                        <Badge variant="secondary">{log.classification.aiMode}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Mensagem:</strong>
                      <p className="mt-1 p-2 bg-muted rounded text-sm">{log.message}</p>
                    </div>
                    <div>
                      <strong>Resposta:</strong>
                      <p className="mt-1 p-2 bg-blue-50 rounded text-sm">{log.response}</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Confiança: {log.classification.confidence}%</span>
                      <span>Tempo: {log.processingTime}ms</span>
                      <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              )) || <p className="text-muted-foreground">Nenhum log encontrado</p>}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}