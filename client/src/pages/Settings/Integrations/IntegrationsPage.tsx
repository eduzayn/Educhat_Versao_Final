import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/back-button";
import { 
  Settings, 
  Zap, 
  Facebook, 
  MessageSquare, 
  Brain, 
  Bot, 
  Activity,
  Plus,
  Test,
  Save
} from "lucide-react";

interface Integration {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  description?: string;
  lastSync?: string;
  errorCount?: number;
}

interface AIConfig {
  id: number;
  enabledFeatures: {
    webSearch: boolean;
    voiceSynthesis: boolean;
    imageAnalysis: boolean;
    contextualMemory: boolean;
  };
  responseSettings: {
    maxTokens: number;
    temperature: number;
    model: string;
  };
  isActive: boolean;
  openaiApiKey?: string;
  perplexityApiKey?: string;
  elevenlabsApiKey?: string;
  anthropicApiKey?: string;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string;
  category: string;
}

export const IntegrationsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch integrations overview
  const { data: integrationsOverview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['/api/settings/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations');
      if (!response.ok) throw new Error('Falha ao carregar integrações');
      return response.json();
    }
  });

  // Fetch AI configuration
  const { data: aiConfig, isLoading: isLoadingAI } = useQuery({
    queryKey: ['/api/settings/integrations/ai/config'],
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations/ai/config');
      if (!response.ok) throw new Error('Falha ao carregar configuração IA');
      return response.json() as Promise<AIConfig>;
    }
  });

  // Fetch AI detection settings
  const { data: aiDetectionSettings, isLoading: isLoadingDetection } = useQuery({
    queryKey: ['/api/settings/integrations/ai/detection'],
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations/ai/detection');
      if (!response.ok) throw new Error('Falha ao carregar configurações de detecção');
      return response.json() as Promise<SystemSetting[]>;
    }
  });

  // Update AI configuration mutation
  const updateAIConfigMutation = useMutation({
    mutationFn: async (data: Partial<AIConfig>) => {
      const response = await fetch('/api/settings/integrations/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao salvar configuração IA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations/ai/config'] });
      toast({ title: "Configuração IA salva com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configuração IA", variant: "destructive" });
    }
  });

  // Test AI connection mutation
  const testAIConnectionMutation = useMutation({
    mutationFn: async (anthropicApiKey: string) => {
      const response = await fetch('/api/settings/integrations/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropicApiKey }),
      });
      if (!response.ok) throw new Error('Falha ao testar conexão');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: data.success ? "Conexão IA testada com sucesso" : "Falha na conexão IA",
        variant: data.success ? "default" : "destructive"
      });
    }
  });

  // Update AI detection setting mutation
  const updateDetectionSettingMutation = useMutation({
    mutationFn: async (setting: Partial<SystemSetting>) => {
      const response = await fetch('/api/settings/integrations/ai/detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });
      if (!response.ok) throw new Error('Falha ao salvar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations/ai/detection'] });
      toast({ title: "Configuração salva com sucesso" });
    }
  });

  const handleAIConfigSave = (updatedConfig: Partial<AIConfig>) => {
    updateAIConfigMutation.mutate(updatedConfig);
  };

  const handleTestAIConnection = () => {
    if (aiConfig?.anthropicApiKey && aiConfig.anthropicApiKey !== '***CONFIGURED***') {
      testAIConnectionMutation.mutate(aiConfig.anthropicApiKey);
    } else {
      toast({ title: "Configure a chave da API Anthropic primeiro", variant: "destructive" });
    }
  };

  const handleDetectionSettingChange = (key: string, value: string, type: string, description: string) => {
    updateDetectionSettingMutation.mutate({
      key,
      value,
      type,
      description,
      category: 'ai'
    });
  };

  if (isLoadingOverview || isLoadingAI || isLoadingDetection) {
    return (
      <div className="min-h-screen bg-educhat-light">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <BackButton to="/settings" label="Voltar às Configurações" />
            <div>
              <h2 className="text-2xl font-bold">Integrações</h2>
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/settings" label="Voltar às Configurações" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Central de Integrações</h2>
            <p className="text-muted-foreground">
              Gerencie todas as integrações e configurações de IA em um só lugar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">
              {integrationsOverview?.totalActive || 0} Ativas
            </span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Manychat</p>
                  <p className="text-lg font-semibold">
                    {integrationsOverview?.manychat?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Facebook className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Facebook</p>
                  <p className="text-lg font-semibold">
                    {integrationsOverview?.facebook?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">IA</p>
                  <Badge variant={aiConfig?.isActive ? "default" : "secondary"}>
                    {aiConfig?.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Ativas</p>
                  <p className="text-lg font-semibold text-green-600">
                    {integrationsOverview?.totalActive || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="manychat">Manychat</TabsTrigger>
            <TabsTrigger value="ai-config">Configuração IA</TabsTrigger>
            <TabsTrigger value="ai-detection">Detecção IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status das Integrações</CardTitle>
                <CardDescription>
                  Visão geral do status de todas as integrações configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Manychat Integrations */}
                  {integrationsOverview?.manychat?.map((integration: Integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">Manychat Integration</p>
                        </div>
                      </div>
                      <Badge variant={integration.isActive ? "default" : "secondary"}>
                        {integration.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* AI Configuration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Configuração de IA</p>
                        <p className="text-sm text-muted-foreground">Sistema de IA integrado</p>
                      </div>
                    </div>
                    <Badge variant={aiConfig?.isActive ? "default" : "secondary"}>
                      {aiConfig?.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manychat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Integrações Manychat
                </CardTitle>
                <CardDescription>
                  Gerencie suas integrações com o Manychat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrationsOverview?.manychat?.length > 0 ? (
                    integrationsOverview.manychat.map((integration: Integration) => (
                      <div key={integration.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{integration.name}</h4>
                          <Badge variant={integration.isActive ? "default" : "secondary"}>
                            {integration.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        {integration.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {integration.description}
                          </p>
                        )}
                        {integration.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Última sincronização: {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma integração Manychat configurada</p>
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Integração
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Configuração de IA
                </CardTitle>
                <CardDescription>
                  Configure as funcionalidades e parâmetros da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {aiConfig && (
                  <>
                    {/* Main Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ai-active">Sistema de IA</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar ou desativar todas as funcionalidades de IA
                        </p>
                      </div>
                      <Switch
                        id="ai-active"
                        checked={aiConfig.isActive}
                        onCheckedChange={(checked) => 
                          handleAIConfigSave({ isActive: checked })
                        }
                      />
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Funcionalidades</h4>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Busca na Web</Label>
                          <p className="text-sm text-muted-foreground">
                            Permite que a IA faça buscas na internet
                          </p>
                        </div>
                        <Switch
                          checked={aiConfig.enabledFeatures.webSearch}
                          onCheckedChange={(checked) => 
                            handleAIConfigSave({
                              enabledFeatures: {
                                ...aiConfig.enabledFeatures,
                                webSearch: checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Análise de Imagens</Label>
                          <p className="text-sm text-muted-foreground">
                            Capacidade de analisar e descrever imagens
                          </p>
                        </div>
                        <Switch
                          checked={aiConfig.enabledFeatures.imageAnalysis}
                          onCheckedChange={(checked) => 
                            handleAIConfigSave({
                              enabledFeatures: {
                                ...aiConfig.enabledFeatures,
                                imageAnalysis: checked
                              }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Memória Contextual</Label>
                          <p className="text-sm text-muted-foreground">
                            Manter contexto das conversas anteriores
                          </p>
                        </div>
                        <Switch
                          checked={aiConfig.enabledFeatures.contextualMemory}
                          onCheckedChange={(checked) => 
                            handleAIConfigSave({
                              enabledFeatures: {
                                ...aiConfig.enabledFeatures,
                                contextualMemory: checked
                              }
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* API Keys */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Chaves de API</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="anthropic-key">Chave Anthropic</Label>
                        <div className="flex gap-2">
                          <Input
                            id="anthropic-key"
                            type="password"
                            placeholder={aiConfig.anthropicApiKey === '***CONFIGURED***' ? 'Configurada' : 'Digite a chave da API'}
                            value={aiConfig.anthropicApiKey === '***CONFIGURED***' ? '' : aiConfig.anthropicApiKey || ''}
                            onChange={(e) => 
                              handleAIConfigSave({ anthropicApiKey: e.target.value })
                            }
                          />
                          <Button
                            variant="outline"
                            onClick={handleTestAIConnection}
                            disabled={testAIConnectionMutation.isPending}
                          >
                            <Test className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Response Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Configurações de Resposta</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max-tokens">Máximo de Tokens</Label>
                          <Input
                            id="max-tokens"
                            type="number"
                            value={aiConfig.responseSettings.maxTokens}
                            onChange={(e) => 
                              handleAIConfigSave({
                                responseSettings: {
                                  ...aiConfig.responseSettings,
                                  maxTokens: parseInt(e.target.value)
                                }
                              })
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="temperature">Temperatura</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={aiConfig.responseSettings.temperature}
                            onChange={(e) => 
                              handleAIConfigSave({
                                responseSettings: {
                                  ...aiConfig.responseSettings,
                                  temperature: parseFloat(e.target.value)
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-detection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Sistema de Detecção IA
                </CardTitle>
                <CardDescription>
                  Configure as funcionalidades de detecção automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {aiDetectionSettings && aiDetectionSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor={setting.key}>{setting.description}</Label>
                      <p className="text-sm text-muted-foreground">
                        Chave: {setting.key}
                      </p>
                    </div>
                    {setting.type === 'boolean' ? (
                      <Switch
                        id={setting.key}
                        checked={setting.value === 'true'}
                        onCheckedChange={(checked) => 
                          handleDetectionSettingChange(
                            setting.key,
                            checked ? 'true' : 'false',
                            setting.type,
                            setting.description
                          )
                        }
                      />
                    ) : (
                      <Input
                        id={setting.key}
                        type={setting.type === 'number' ? 'number' : 'text'}
                        value={setting.value}
                        className="w-32"
                        onChange={(e) => 
                          handleDetectionSettingChange(
                            setting.key,
                            e.target.value,
                            setting.type,
                            setting.description
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};