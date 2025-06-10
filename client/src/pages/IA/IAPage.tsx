import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Brain, MessageSquare, Target, TrendingUp, Users } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

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
  const [testMessage, setTestMessage] = useState('');
  const [newContext, setNewContext] = useState({ title: '', content: '', category: '' });

  // Buscar estatísticas da IA
  const { data: stats } = useQuery<AIStats>({
    queryKey: ['/api/ia/stats'],
  });

  // Buscar logs de interações
  const { data: logs } = useQuery<AILog[]>({
    queryKey: ['/api/ia/logs'],
  });

  // Buscar contextos de treinamento
  const { data: contexts } = useQuery<TrainingContext[]>({
    queryKey: ['/api/ia/context'],
  });

  // Mutation para classificar mensagem
  const classifyMutation = useMutation({
    mutationFn: (data: { message: string }) => 
      apiRequest('/api/ia/classify', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    },
  });

  // Mutation para adicionar contexto
  const addContextMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      apiRequest('/api/ia/train', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/context'] });
      setNewContext({ title: '', content: '', category: '' });
    },
  });

  // Mutation para alternar status do contexto
  const toggleContextMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/ia/context/${id}/toggle`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/context'] });
    },
  });

  const handleTestMessage = () => {
    if (testMessage.trim()) {
      classifyMutation.mutate({ message: testMessage });
      setTestMessage('');
    }
  };

  const handleAddContext = () => {
    if (newContext.title && newContext.content && newContext.category) {
      addContextMutation.mutate(newContext);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Prof. Ana - IA Inteligente</h1>
          <p className="text-gray-600">Assistente de relacionamento educacional com personalidades adaptáveis</p>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
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
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Testar IA</TabsTrigger>
          <TabsTrigger value="logs">Logs de Interação</TabsTrigger>
          <TabsTrigger value="training">Treinamento</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Testar IA */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar Classificação da IA</CardTitle>
              <CardDescription>
                Digite uma mensagem para testar como a Prof. Ana classifica e responde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem para testar..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                />
                <Button 
                  onClick={handleTestMessage}
                  disabled={!testMessage.trim() || classifyMutation.isPending}
                >
                  {classifyMutation.isPending ? 'Processando...' : 'Testar'}
                </Button>
              </div>

              {classifyMutation.data && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">
                      Intenção: {classifyMutation.data.classification.intent}
                    </Badge>
                    <Badge variant="outline">
                      Sentimento: {classifyMutation.data.classification.sentiment}
                    </Badge>
                    <Badge variant="outline">
                      Confiança: {classifyMutation.data.classification.confidence}%
                    </Badge>
                    <Badge variant="outline">
                      Modo: {classifyMutation.data.classification.aiMode}
                    </Badge>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>Resposta da Prof. Ana:</strong>
                    <p className="mt-1">{classifyMutation.data.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs de Interação */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Interações</CardTitle>
              <CardDescription>
                Últimas interações processadas pela Prof. Ana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs?.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{log.classification.intent}</Badge>
                        <Badge variant="outline">{log.classification.sentiment}</Badge>
                        <Badge variant="outline">{log.classification.aiMode}</Badge>
                        <Badge variant="secondary">{log.processingTime}ms</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <strong>Mensagem:</strong> {log.message}
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <strong>Resposta:</strong> {log.response}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treinamento */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Contexto de Treinamento</CardTitle>
              <CardDescription>
                Adicione novos conhecimentos para a Prof. Ana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Título do contexto"
                  value={newContext.title}
                  onChange={(e) => setNewContext(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Categoria (ex: cursos, procedimentos)"
                  value={newContext.category}
                  onChange={(e) => setNewContext(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <Textarea
                placeholder="Conteúdo do conhecimento..."
                value={newContext.content}
                onChange={(e) => setNewContext(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
              <Button 
                onClick={handleAddContext}
                disabled={!newContext.title || !newContext.content || !newContext.category || addContextMutation.isPending}
              >
                {addContextMutation.isPending ? 'Adicionando...' : 'Adicionar Contexto'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contextos Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contexts?.map((context) => (
                  <div key={context.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{context.title}</div>
                      <div className="text-sm text-gray-600">{context.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={context.isActive ? "default" : "secondary"}>
                        {context.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleContextMutation.mutate(context.id)}
                        disabled={toggleContextMutation.isPending}
                      >
                        {context.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análises */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análises de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Principais Intenções</h4>
                  <div className="space-y-2">
                    {stats?.topIntents?.map((intent, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{intent.intent}</span>
                        <Badge variant="outline">{intent.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Métricas de Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Tempo Médio de Resposta:</span>
                      <span className="font-medium">{stats?.avgResponseTime || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Conversão:</span>
                      <span className="font-medium">
                        {stats?.leadsGenerated && stats?.totalInteractions 
                          ? Math.round((stats.leadsGenerated / stats.totalInteractions) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}