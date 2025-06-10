import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { BackButton } from '@/shared/components/BackButton';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Zap, 
  MessageSquare, 
  Webhook, 
  Mail, 
  Calendar,
  Bot,
  Settings,
  TestTube,
  Copy,
  Check,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ManychatIntegration {
  id?: number;
  name: string;
  apiKey: string;
  webhookUrl: string;
  isActive: boolean;
  syncEnabled: boolean;
  leadSyncEnabled: boolean;
  enrollmentSyncEnabled: boolean;
  notificationSyncEnabled: boolean;
  configuration?: {
    defaultCourse?: string;
    leadSource?: string;
    autoAssignTeam?: string;
  };
}

export function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  // Estados para formulário do Manychat
  const [manychatConfig, setManychatConfig] = useState({
    name: 'Manychat Principal',
    apiKey: '',
    webhookUrl: '',
    isActive: false,
    syncEnabled: true,
    leadSyncEnabled: true,
    enrollmentSyncEnabled: true,
    notificationSyncEnabled: false,
    configuration: {
      defaultCourse: '',
      leadSource: 'Manychat',
      autoAssignTeam: 'comercial'
    }
  });

  // Gerar URL do webhook automaticamente
  const generateWebhookUrl = () => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/api/integrations/manychat/webhook`;
  };

  const copyWebhookUrl = async () => {
    const url = generateWebhookUrl();
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      toast({
        title: "URL copiada!",
        description: "A URL do webhook foi copiada para a área de transferência."
      });
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a URL. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Query para buscar configurações existentes
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['/api/integrations/manychat'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/integrations/manychat');
        if (response.ok) {
          return response.json();
        }
        return [];
      } catch (error) {
        return [];
      }
    }
  });

  // Mutation para salvar configurações
  const saveConfigMutation = useMutation({
    mutationFn: (data: ManychatIntegration) => 
      apiRequest('POST', '/api/integrations/manychat', data),
    onSuccess: () => {
      toast({
        title: "Configuração salva!",
        description: "A integração com o Manychat foi configurada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/manychat'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração.",
        variant: "destructive"
      });
    }
  });

  // Mutation para testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: () => 
      apiRequest('POST', '/api/integrations/manychat/test', {
        apiKey: manychatConfig.apiKey
      }),
    onSuccess: (data) => {
      setTestResult(data);
      setIsTestDialogOpen(true);
      toast({
        title: "Teste concluído!",
        description: "Verifique os resultados na janela de teste."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao testar a conexão.",
        variant: "destructive"
      });
    }
  });

  const handleSaveConfig = () => {
    if (!manychatConfig.apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a API Key do Manychat.",
        variant: "destructive"
      });
      return;
    }

    const configWithWebhook = {
      ...manychatConfig,
      webhookUrl: generateWebhookUrl()
    };

    saveConfigMutation.mutate(configWithWebhook);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Integrações
            </h1>
            <p className="text-gray-600">
              Configure integrações com serviços externos para automatizar seus processos educacionais
            </p>
          </div>

          <Tabs defaultValue="manychat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manychat" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Manychat
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="outros" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Outros
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manychat" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-purple-600" />
                    Integração Manychat
                  </CardTitle>
                  <CardDescription>
                    Configure a integração com o Manychat para automatizar a captação de leads e comunicação com alunos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status da Integração */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${manychatConfig.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">Status da Integração</p>
                        <p className="text-sm text-gray-600">
                          {manychatConfig.isActive ? 'Ativa e funcionando' : 'Inativa'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={manychatConfig.isActive ? 'default' : 'secondary'}>
                      {manychatConfig.isActive ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>

                  {/* Configurações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manychat-name">Nome da Integração</Label>
                        <Input
                          id="manychat-name"
                          value={manychatConfig.name}
                          onChange={(e) => setManychatConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Manychat Principal"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manychat-api-key">
                          API Key do Manychat
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="manychat-api-key"
                          type="password"
                          value={manychatConfig.apiKey}
                          onChange={(e) => setManychatConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="Insira sua API Key do Manychat"
                        />
                        <p className="text-xs text-gray-500">
                          Encontre sua API Key no painel do Manychat {'>'} Settings {'>'} API
                        </p>
                      </div>


                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>URL do Webhook</Label>
                        <div className="flex gap-2">
                          <Input
                            value={generateWebhookUrl()}
                            readOnly
                            className="bg-gray-50"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyWebhookUrl}
                            className="shrink-0"
                          >
                            {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Use esta URL no seu painel do Manychat para configurar o webhook
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="default-course">Curso Padrão</Label>
                        <Select
                          value={manychatConfig.configuration?.defaultCourse || ''}
                          onValueChange={(value) => setManychatConfig(prev => ({
                            ...prev,
                            configuration: { ...prev.configuration, defaultCourse: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um curso padrão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="graduacao">Graduação</SelectItem>
                            <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="livre">Curso Livre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="auto-assign-team">Equipe de Atribuição Automática</Label>
                        <Select
                          value={manychatConfig.configuration?.autoAssignTeam || 'comercial'}
                          onValueChange={(value) => setManychatConfig(prev => ({
                            ...prev,
                            configuration: { ...prev.configuration, autoAssignTeam: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="suporte">Suporte</SelectItem>
                            <SelectItem value="secretaria">Secretaria</SelectItem>
                            <SelectItem value="tutoria">Tutoria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Configurações de Sincronização */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configurações de Sincronização</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Sincronização de Leads</Label>
                          <p className="text-sm text-gray-600">
                            Transferir leads do Manychat para o EduChat automaticamente
                          </p>
                        </div>
                        <Switch
                          checked={manychatConfig.leadSyncEnabled}
                          onCheckedChange={(checked) => setManychatConfig(prev => ({ ...prev, leadSyncEnabled: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Sincronização de Matrículas</Label>
                          <p className="text-sm text-gray-600">
                            Notificar o Manychat sobre novas matrículas
                          </p>
                        </div>
                        <Switch
                          checked={manychatConfig.enrollmentSyncEnabled}
                          onCheckedChange={(checked) => setManychatConfig(prev => ({ ...prev, enrollmentSyncEnabled: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Notificações Automáticas</Label>
                          <p className="text-sm text-gray-600">
                            Enviar avisos e lembretes via Manychat
                          </p>
                        </div>
                        <Switch
                          checked={manychatConfig.notificationSyncEnabled}
                          onCheckedChange={(checked) => setManychatConfig(prev => ({ ...prev, notificationSyncEnabled: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Integração Ativa</Label>
                          <p className="text-sm text-gray-600">
                            Ativar/desativar toda a integração
                          </p>
                        </div>
                        <Switch
                          checked={manychatConfig.isActive}
                          onCheckedChange={(checked) => setManychatConfig(prev => ({ ...prev, isActive: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-4 pt-4 border-t">
                    <Button 
                      onClick={handleSaveConfig}
                      disabled={saveConfigMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => testConnectionMutation.mutate()}
                      disabled={testConnectionMutation.isPending || !manychatConfig.apiKey}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testConnectionMutation.isPending ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://api.manychat.com/swagger?urls.primaryName=Page%20API', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Documentação API
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Instruções */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Como Configurar a Integração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold">1. Obter Credenciais do Manychat</h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Acesse o painel do Manychat</li>
                        <li>Vá em Settings {'>'} API</li>
                        <li>Copie a API Key</li>
                        <li>Obtenha o Page Access Token da sua página do Facebook</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">2. Configurar Webhook no Manychat</h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Copie a URL do webhook acima</li>
                        <li>No Manychat, vá em Settings {'>'} Webhooks</li>
                        <li>Cole a URL e configure os eventos</li>
                        <li>Teste a conexão usando o botão "Testar Conexão"</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Importante:</p>
                        <p className="text-blue-700">
                          A integração permite automatizar a transferência de leads entre o Manychat e o EduChat, 
                          facilitando o processo de captação e matrícula de alunos.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp">
              {/* Usar o componente existente */}
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Integração WhatsApp</h3>
                <p className="text-gray-600 mb-4">
                  A integração com WhatsApp já está disponível na seção de Canais
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/settings/channels'}>
                  Gerenciar Canais WhatsApp
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="webhooks">
              <div className="text-center py-12">
                <Webhook className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Webhooks Personalizados</h3>
                <p className="text-gray-600">
                  Em desenvolvimento - Webhooks personalizados para integrações avançadas
                </p>
              </div>
            </TabsContent>

            <TabsContent value="outros">
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Outras Integrações</h3>
                <p className="text-gray-600">
                  Em breve: Integração com CRM externos, sistemas de pagamento e mais
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog de Teste de Conexão */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resultado do Teste de Conexão</DialogTitle>
              <DialogDescription>
                Verifique se a conexão com o Manychat está funcionando corretamente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {testResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? 'Conexão bem-sucedida!' : 'Falha na conexão'}
                    </span>
                  </div>
                  
                  {testResult.data && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {testResult.error && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-700">{testResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default IntegrationsPage;