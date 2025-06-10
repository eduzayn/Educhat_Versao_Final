import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';
import { Textarea } from '../../shared/ui/textarea';
import { Badge } from '../../shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import { Brain, MessageSquare, Target, TrendingUp, Users, Activity, ArrowLeft, Search } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

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

export default function IAPage() {
  const [, setLocation] = useLocation();
  const [testMessage, setTestMessage] = useState('');
  const [newContext, setNewContext] = useState({
    title: '',
    content: '',
    category: ''
  });

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
    if (!newContext.title || !newContext.content || !newContext.category) return;
    addContextMutation.mutate(newContext);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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
                Adicione novos contextos para melhorar o treinamento da IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContextSubmit} className="space-y-4">
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
                  placeholder="Conteúdo do contexto"
                  value={newContext.content}
                  onChange={(e) => setNewContext(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[120px]"
                />
                <Button 
                  type="submit" 
                  disabled={addContextMutation.isPending || !newContext.title || !newContext.content || !newContext.category}
                >
                  {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Contexto'}
                </Button>
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