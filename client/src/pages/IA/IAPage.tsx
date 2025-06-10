import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Bot, 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  BarChart3,
  Users,
  Clock,
  Star,
  ArrowLeft,
  Power,
  PowerOff
} from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { useToast } from "@/shared/lib/hooks/use-toast";

// Schema for AI context form
const contextSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["educational", "support", "sales", "general"]),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  metadata: z.object({
    tags: z.array(z.string()).default([]),
    priority: z.enum(["low", "medium", "high"]).default("medium")
  }).default({})
});

type ContextFormData = z.infer<typeof contextSchema>;

export function IAPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [contextDialogOpen, setContextDialogOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState({
    aiActive: true,
    learningMode: true,
    autoHandoff: true,
    operationMode: "mentor",
    confidenceThreshold: 75
  });

  // Query para buscar contextos de IA
  const { data: contextsData, isLoading: contextsLoading } = useQuery({
    queryKey: ["/api/ia/context"],
    queryFn: () => apiRequest("GET", "/api/ia/context")
  });
  const contexts = Array.isArray(contextsData) ? contextsData : [];

  // Query para buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/ia/stats"],
    queryFn: () => apiRequest("GET", "/api/ia/stats")
  });

  // Query para buscar logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/ia/logs"],
    queryFn: () => apiRequest("GET", "/api/ia/logs")
  });
  const logs = Array.isArray(logsData) ? logsData : [];

  // Query para status do atendimento automático
  const { data: autoResponseStatus, isLoading: statusLoading } = useQuery<{enabled: boolean, message: string}>({
    queryKey: ["/api/ia/auto-response/status"],
    queryFn: () => apiRequest("GET", "/api/ia/auto-response/status")
  });

  // Mutation para controlar atendimento automático
  const toggleAutoResponseMutation = useMutation({
    mutationFn: (enabled: boolean) => apiRequest("POST", "/api/ia/auto-response", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ia/auto-response/status"] });
      toast({
        title: "Status atualizado",
        description: "Atendimento automático da Prof. Ana atualizado com sucesso"
      });
    }
  });

  // Mutation para salvar configurações da IA
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: typeof aiSettings) => apiRequest("POST", "/api/ia/settings", settings),
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações da Prof. Ana foram atualizadas com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Form para contexto
  const contextForm = useForm<ContextFormData>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      name: "",
      type: "educational",
      content: "",
      metadata: {
        tags: [],
        priority: "medium"
      }
    }
  });

  // Mutations
  const createContextMutation = useMutation({
    mutationFn: (data: ContextFormData) => apiRequest("POST", "/api/ia/context", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ia/context"] });
      setContextDialogOpen(false);
      contextForm.reset();
      toast({ title: "Contexto criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar contexto", variant: "destructive" });
    }
  });

  const updateContextMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContextFormData> }) => 
      apiRequest("PUT", `/api/ia/context/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ia/context"] });
      setContextDialogOpen(false);
      setEditingContext(null);
      contextForm.reset();
      toast({ title: "Contexto atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar contexto", variant: "destructive" });
    }
  });

  const deleteContextMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ia/context/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ia/context"] });
      toast({ title: "Contexto removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover contexto", variant: "destructive" });
    }
  });

  const handleSubmitContext = (data: ContextFormData) => {
    if (editingContext) {
      updateContextMutation.mutate({ id: editingContext.id, data });
    } else {
      createContextMutation.mutate(data);
    }
  };

  const handleEditContext = (context: any) => {
    setEditingContext(context);
    contextForm.reset({
      name: context.name,
      type: context.type,
      content: context.content,
      metadata: context.metadata || { tags: [], priority: "medium" }
    });
    setContextDialogOpen(true);
  };

  const handleDeleteContext = (id: number) => {
    if (confirm("Tem certeza que deseja remover este contexto?")) {
      deleteContextMutation.mutate(id);
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      educational: "Educacional",
      support: "Suporte",
      sales: "Vendas",
      general: "Geral"
    };
    return types[type as keyof typeof types] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-educhat-light p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with return button and auto-response control */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="h-4 w-px bg-gray-300" />
              <Bot className="h-8 w-8 text-educhat-primary" />
              <h1 className="text-3xl font-bold text-educhat-dark">Prof. Ana</h1>
              <Badge variant="secondary" className="ml-2">Assistente de IA</Badge>
            </div>
            
            {/* Auto-response control */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {autoResponseStatus?.enabled ? (
                  <Power className="h-4 w-4 text-green-600" />
                ) : (
                  <PowerOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  Atendimento Automático
                </span>
                <Switch
                  checked={autoResponseStatus?.enabled || false}
                  onCheckedChange={(checked) => toggleAutoResponseMutation.mutate(checked)}
                  disabled={toggleAutoResponseMutation.isPending || statusLoading}
                />
              </div>
            </div>
          </div>
          <p className="text-educhat-medium">
            Sistema inteligente de atendimento educacional com IA avançada
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Contexto
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interações Totais</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : (stats as any)?.totalInteractions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads Convertidos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : (stats as any)?.leadsConverted || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Conversões da IA</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : `${(stats as any)?.avgResponseTime || 0}s`}
                  </div>
                  <p className="text-xs text-muted-foreground">Resposta da IA</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : `${(stats as any)?.satisfactionRate || 0}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">Taxa de satisfação</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logsLoading ? (
                    <div className="text-center py-8 text-educhat-medium">
                      Carregando atividades...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-educhat-medium">
                      Nenhuma atividade encontrada
                    </div>
                  ) : (
                    logs.slice(0, 5).map((log: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-educhat-primary" />
                          <div>
                            <p className="font-medium">{log.userMessage || "Interação da IA"}</p>
                            <p className="text-sm text-educhat-medium">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Agora"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={log.classification === 'lead' ? 'default' : 'secondary'}>
                          {log.classification || 'geral'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Context Tab */}
          <TabsContent value="context" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Contextos de IA</h2>
              <Dialog open={contextDialogOpen} onOpenChange={setContextDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Contexto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContext ? "Editar Contexto" : "Novo Contexto"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...contextForm}>
                    <form onSubmit={contextForm.handleSubmit(handleSubmitContext)} className="space-y-4">
                      <FormField
                        control={contextForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do contexto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={contextForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="educational">Educacional</SelectItem>
                                <SelectItem value="support">Suporte</SelectItem>
                                <SelectItem value="sales">Vendas</SelectItem>
                                <SelectItem value="general">Geral</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={contextForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Conteúdo do contexto para treinar a IA..."
                                rows={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setContextDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createContextMutation.isPending || updateContextMutation.isPending}
                        >
                          {editingContext ? "Atualizar" : "Criar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contextsLoading ? (
                <div className="col-span-full text-center py-8 text-educhat-medium">
                  Carregando contextos...
                </div>
              ) : contexts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-educhat-medium">
                  Nenhum contexto encontrado. Crie seu primeiro contexto para treinar a Prof. Ana.
                </div>
              ) : (
                contexts.map((context: any) => (
                  <Card key={context.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{context.name}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{getTypeLabel(context.type)}</Badge>
                            <Badge className={getPriorityColor(context.metadata?.priority || 'medium')}>
                              {context.metadata?.priority || 'medium'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditContext(context)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteContext(context.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-educhat-medium line-clamp-3">
                        {context.content}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-educhat-medium">
                        <span>
                          {context.createdAt ? new Date(context.createdAt).toLocaleDateString() : ""}
                        </span>
                        <Badge variant={context.isActive ? "default" : "secondary"}>
                          {context.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Atividade da IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logsLoading ? (
                    <div className="text-center py-8 text-educhat-medium">
                      Carregando logs...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-educhat-medium">
                      Nenhum log encontrado
                    </div>
                  ) : (
                    logs.map((log: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-educhat-primary" />
                            <span className="font-medium">Interação #{log.id || index + 1}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={log.classification === 'lead' ? 'default' : 'secondary'}>
                              {log.classification || 'geral'}
                            </Badge>
                            {log.sentiment && (
                              <Badge variant={log.sentiment === 'positive' ? 'default' : 'outline'}>
                                {log.sentiment}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-educhat-medium mb-2">
                          <strong>Usuário:</strong> {log.userMessage || "Mensagem não disponível"}
                        </p>
                        <p className="text-sm text-educhat-medium mb-2">
                          <strong>IA:</strong> {log.aiResponse || "Resposta não disponível"}
                        </p>
                        <div className="flex justify-between text-xs text-educhat-medium">
                          <span>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Data não disponível"}
                          </span>
                          {log.processingTime && (
                            <span>Processamento: {log.processingTime}ms</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Prof. Ana</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">IA Ativa</h3>
                    <p className="text-sm text-educhat-medium">Ativar ou desativar o assistente de IA</p>
                  </div>
                  <Switch 
                    checked={aiSettings.aiActive}
                    onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, aiActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Modo Aprendizado</h3>
                    <p className="text-sm text-educhat-medium">Permite que a IA aprenda com novas interações</p>
                  </div>
                  <Switch 
                    checked={aiSettings.learningMode}
                    onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, learningMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Handoff Automático</h3>
                    <p className="text-sm text-educhat-medium">Transferir automaticamente para humanos quando necessário</p>
                  </div>
                  <Switch 
                    checked={aiSettings.autoHandoff}
                    onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoHandoff: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Modo de Operação</h3>
                  <Select 
                    value={aiSettings.operationMode} 
                    onValueChange={(value) => setAiSettings(prev => ({ ...prev, operationMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">Mentor Educacional</SelectItem>
                      <SelectItem value="support">Suporte Técnico</SelectItem>
                      <SelectItem value="sales">Assistente de Vendas</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Nível de Confiança Mínimo</h3>
                  <Input 
                    type="number" 
                    value={aiSettings.confidenceThreshold} 
                    onChange={(e) => setAiSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) || 75 }))}
                    min="0" 
                    max="100" 
                  />
                  <p className="text-xs text-educhat-medium">
                    Confiança mínima para respostas automáticas (0-100%)
                  </p>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => saveSettingsMutation.mutate(aiSettings)}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}