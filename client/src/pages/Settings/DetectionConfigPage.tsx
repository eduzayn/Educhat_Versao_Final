import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useToast } from '@/shared/lib/hooks/useToast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, TestTube, Settings, Brain, FileText, Play } from 'lucide-react';

interface Macrosetor {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  keywords: Keyword[];
  createdAt: string;
  updatedAt: string;
}

interface Keyword {
  id: number;
  macrosetorId: number;
  keyword: string;
  weight: number;
  isActive: boolean;
  createdAt: string;
}

interface DetectionLog {
  id: number;
  content: string;
  detectedMacrosetor?: string;
  confidence?: number;
  matchedKeywords?: string[];
  channel?: string;
  createdAt: string;
}

export default function DetectionConfigPage() {
  const [selectedMacrosetor, setSelectedMacrosetor] = useState<Macrosetor | null>(null);
  const [showMacrosetorDialog, setShowMacrosetorDialog] = useState(false);
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingMacrosetor, setEditingMacrosetor] = useState<Macrosetor | null>(null);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: macrosetores = [], isLoading: loadingMacrosetores } = useQuery({
    queryKey: ['/api/settings/macrosetores'],
    queryFn: () => apiRequest('GET', '/api/settings/macrosetores')
  });

  const { data: detectionLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['/api/settings/macrosetores/detection-logs'],
    queryFn: () => apiRequest('GET', '/api/settings/macrosetores/detection-logs?limit=50')
  });

  // Mutations
  const createMacrosetorMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/settings/macrosetores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setShowMacrosetorDialog(false);
      setEditingMacrosetor(null);
      toast({ title: 'Macrosetor criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar macrosetor', variant: 'destructive' });
    }
  });

  const updateMacrosetorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/settings/macrosetores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setShowMacrosetorDialog(false);
      setEditingMacrosetor(null);
      toast({ title: 'Macrosetor atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar macrosetor', variant: 'destructive' });
    }
  });

  const deleteMacrosetorMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/settings/macrosetores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      toast({ title: 'Macrosetor removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover macrosetor', variant: 'destructive' });
    }
  });

  const createKeywordMutation = useMutation({
    mutationFn: ({ macrosetorId, data }: { macrosetorId: number; data: any }) => 
      apiRequest('POST', `/api/settings/macrosetores/${macrosetorId}/keywords`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setShowKeywordDialog(false);
      setEditingKeyword(null);
      toast({ title: 'Palavra-chave adicionada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar palavra-chave', variant: 'destructive' });
    }
  });

  const updateKeywordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/settings/keywords/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setShowKeywordDialog(false);
      setEditingKeyword(null);
      toast({ title: 'Palavra-chave atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar palavra-chave', variant: 'destructive' });
    }
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/settings/keywords/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      toast({ title: 'Palavra-chave removida com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover palavra-chave', variant: 'destructive' });
    }
  });

  const testDetectionMutation = useMutation({
    mutationFn: (data: { content: string; channel?: string }) => 
      apiRequest('POST', '/api/settings/macrosetores/test-detection', data),
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: () => {
      toast({ title: 'Erro ao testar detecção', variant: 'destructive' });
    }
  });

  const initializeMacrosetoresMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/settings/macrosetores/initialize'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      toast({ title: 'Macrosetores padrão inicializados com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao inicializar macrosetores', variant: 'destructive' });
    }
  });

  const handleCreateMacrosetor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priority: parseInt(formData.get('priority') as string),
      isActive: formData.get('isActive') === 'on'
    };

    if (editingMacrosetor) {
      updateMacrosetorMutation.mutate({ id: editingMacrosetor.id, data });
    } else {
      createMacrosetorMutation.mutate(data);
    }
  };

  const handleCreateKeyword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      keyword: formData.get('keyword') as string,
      weight: parseInt(formData.get('weight') as string),
      isActive: formData.get('isActive') === 'on'
    };

    if (editingKeyword) {
      updateKeywordMutation.mutate({ id: editingKeyword.id, data });
    } else if (selectedMacrosetor) {
      createKeywordMutation.mutate({ macrosetorId: selectedMacrosetor.id, data });
    }
  };

  const handleTestDetection = () => {
    if (testContent.trim()) {
      testDetectionMutation.mutate({ content: testContent });
    }
  };

  const formatConfidence = (confidence?: number) => {
    if (confidence === undefined || confidence === null) return '0%';
    return `${confidence}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Detecção de Macrosetores</h1>
          <p className="text-muted-foreground">
            Configure expressões e palavras-chave para classificação automática de mensagens
          </p>
        </div>
        
        <div className="flex gap-2">
          {macrosetores.length === 0 && (
            <Button 
              onClick={() => initializeMacrosetoresMutation.mutate()}
              disabled={initializeMacrosetoresMutation.isPending}
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuração Inicial
            </Button>
          )}
          
          <Button onClick={() => setShowTestDialog(true)} variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            Testar Detecção
          </Button>
          
          <Button onClick={() => setShowMacrosetorDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Macrosetor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="macrosetores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="macrosetores">
            <Brain className="w-4 h-4 mr-2" />
            Macrosetores
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="w-4 h-4 mr-2" />
            Logs de Detecção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="macrosetores" className="space-y-4">
          {loadingMacrosetores ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando macrosetores...</p>
            </div>
          ) : macrosetores.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum macrosetor configurado</h3>
                <p className="text-muted-foreground mb-4">
                  Configure os macrosetores para classificação automática de mensagens
                </p>
                <Button onClick={() => initializeMacrosetoresMutation.mutate()}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Macrosetores Padrão
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {macrosetores.map((macrosetor: Macrosetor) => (
                <Card key={macrosetor.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {macrosetor.name}
                          <Badge variant={macrosetor.isActive ? "default" : "secondary"}>
                            {macrosetor.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            Prioridade {macrosetor.priority}
                          </Badge>
                        </CardTitle>
                        {macrosetor.description && (
                          <CardDescription className="mt-1">
                            {macrosetor.description}
                          </CardDescription>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMacrosetor(macrosetor);
                            setShowKeywordDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Palavra-chave
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMacrosetor(macrosetor);
                            setShowMacrosetorDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMacrosetorMutation.mutate(macrosetor.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">
                          Palavras-chave ({macrosetor.keywords?.length || 0})
                        </h4>
                        {macrosetor.keywords?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {macrosetor.keywords.map((keyword) => (
                              <Badge
                                key={keyword.id}
                                variant={keyword.isActive ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {keyword.keyword}
                                <span className="ml-1 text-muted-foreground">
                                  ({keyword.weight})
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 ml-1"
                                  onClick={() => {
                                    setEditingKeyword(keyword);
                                    setSelectedMacrosetor(macrosetor);
                                    setShowKeywordDialog(true);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 ml-1"
                                  onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Nenhuma palavra-chave configurada
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {loadingLogs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando logs...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Logs de Detecção Recentes</CardTitle>
                <CardDescription>
                  Histórico das últimas 50 detecções de macrosetores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectionLogs.map((log: DetectionLog) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-2">
                          <Badge variant="outline">{log.detectedMacrosetor || 'geral'}</Badge>
                          <Badge variant="secondary">
                            {formatConfidence(log.confidence)}
                          </Badge>
                          {log.channel && (
                            <Badge variant="outline">{log.channel}</Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{log.content}</p>
                      {log.matchedKeywords && log.matchedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.matchedKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Macrosetor */}
      <Dialog open={showMacrosetorDialog} onOpenChange={setShowMacrosetorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMacrosetor ? 'Editar Macrosetor' : 'Novo Macrosetor'}
            </DialogTitle>
            <DialogDescription>
              Configure as informações básicas do macrosetor
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateMacrosetor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingMacrosetor?.name || ''}
                placeholder="Ex: comercial, suporte, cobrança"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingMacrosetor?.description || ''}
                placeholder="Descreva o propósito deste macrosetor"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={editingMacrosetor?.priority || 1}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    name="isActive"
                    defaultChecked={editingMacrosetor?.isActive ?? true}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMacrosetorDialog(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createMacrosetorMutation.isPending || updateMacrosetorMutation.isPending}
              >
                {editingMacrosetor ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Palavra-chave */}
      <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKeyword ? 'Editar Palavra-chave' : 'Nova Palavra-chave'}
            </DialogTitle>
            <DialogDescription>
              Adicione uma palavra-chave para o macrosetor "{selectedMacrosetor?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateKeyword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Palavra-chave</Label>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={editingKeyword?.keyword || ''}
                placeholder="Ex: boleto, pagamento, suporte"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={editingKeyword?.weight || 1}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    name="isActive"
                    defaultChecked={editingKeyword?.isActive ?? true}
                  />
                  <Label>Ativa</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowKeywordDialog(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createKeywordMutation.isPending || updateKeywordMutation.isPending}
              >
                {editingKeyword ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Teste */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testar Detecção de Macrosetor</DialogTitle>
            <DialogDescription>
              Digite uma mensagem para testar o sistema de detecção
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testContent">Mensagem de Teste</Label>
              <Textarea
                id="testContent"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Digite uma mensagem para testar..."
                rows={4}
              />
            </div>
            
            <Button 
              onClick={handleTestDetection}
              disabled={!testContent.trim() || testDetectionMutation.isPending}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Executar Teste
            </Button>
            
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resultado da Detecção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="default">{testResult.macrosetor}</Badge>
                    <Badge variant="secondary">
                      {formatConfidence(testResult.confidence * 100)}
                    </Badge>
                  </div>
                  {testResult.matchedKeywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Palavras-chave encontradas:</p>
                      <div className="flex flex-wrap gap-1">
                        {testResult.matchedKeywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}