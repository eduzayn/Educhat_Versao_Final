import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AlertCircle, CheckCircle, Facebook, Instagram, MessageSquare, Settings, Webhook } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FacebookIntegration {
  id: number;
  name: string;
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  webhookUrl: string;
  isActive: boolean;
  connectionStatus: string;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}

export default function FacebookIntegrationPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    pageId: '',
    pageAccessToken: '',
    appSecret: '',
    verifyToken: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar integrações existentes
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations/facebook'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/facebook');
      return Array.isArray(response) ? response : [];
    }
  });

  // Criar nova integração
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest('POST', '/api/integrations/facebook', data),
    onSuccess: () => {
      toast({
        title: "Integração criada",
        description: "Integração Facebook/Instagram criada com sucesso."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar integração.",
        variant: "destructive"
      });
    }
  });

  // Atualizar integração
  const updateMutation = useMutation({
    mutationFn: (data: FormData & { id: number }) => 
      apiRequest('PUT', `/api/integrations/facebook/${data.id}`, data),
    onSuccess: () => {
      toast({
        title: "Integração atualizada",
        description: "Integração Facebook/Instagram atualizada com sucesso."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar integração.",
        variant: "destructive"
      });
    }
  });

  // Deletar integração
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/integrations/facebook/${id}`),
    onSuccess: () => {
      toast({
        title: "Integração removida",
        description: "Integração Facebook/Instagram removida com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover integração.",
        variant: "destructive"
      });
    }
  });

  // Testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/integrations/facebook/test', {}),
    onSuccess: () => {
      toast({
        title: "Conexão testada",
        description: "Conexão com Facebook/Instagram está funcionando."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro de conexão",
        description: error.message || "Erro ao testar conexão.",
        variant: "destructive"
      });
    }
  });

  // Alterar status da integração
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest('PUT', `/api/integrations/facebook/${id}/status`, { isActive }),
    onSuccess: () => {
      toast({
        title: "Status alterado",
        description: "Status da integração alterado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      pageId: '',
      pageAccessToken: '',
      appSecret: '',
      verifyToken: ''
    });
    setEditingId(null);
  };

  const handleEdit = (integration: FacebookIntegration) => {
    setFormData({
      name: integration.name,
      pageId: integration.pageId,
      pageAccessToken: integration.pageAccessToken,
      appSecret: integration.appSecret,
      verifyToken: integration.verifyToken
    });
    setEditingId(integration.id);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ ...formData, id: editingId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600">Conectada</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="secondary">Desconhecida</Badge>;
    }
  };

  const generateWebhookUrl = () => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://educhat.com.br' 
      : window.location.origin;
    return `${baseUrl}/api/webhooks/facebook`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Facebook className="h-6 w-6 text-blue-600" />
          <Instagram className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Integração Facebook & Instagram</h1>
          <p className="text-muted-foreground">
            Configure a integração com Facebook Messenger e Instagram Direct
          </p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Lista de integrações existentes */}
          {integrations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Integrações Ativas</h3>
              {integrations.map((integration: FacebookIntegration) => (
                <Card key={integration.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-5 w-5 text-blue-600" />
                          <Instagram className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <CardDescription>
                            Página ID: {integration.pageId}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.connectionStatus, integration.isActive)}
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={(checked: boolean) =>
                            toggleStatusMutation.mutate({ id: integration.id, isActive: checked })
                          }
                          disabled={toggleStatusMutation.isPending}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate()}
                        disabled={testConnectionMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Testar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(integration.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Editar Integração' : 'Nova Integração'}
              </CardTitle>
              <CardDescription>
                Configure os dados de acesso da sua página do Facebook/Instagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Integração</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Página Principal"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageId">ID da Página</Label>
                  <Input
                    id="pageId"
                    placeholder="ID numérico da página"
                    value={formData.pageId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, pageId: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageAccessToken">Token de Acesso da Página</Label>
                <Input
                  id="pageAccessToken"
                  type="password"
                  placeholder="Token de acesso da página"
                  value={formData.pageAccessToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, pageAccessToken: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appSecret">App Secret</Label>
                  <Input
                    id="appSecret"
                    type="password"
                    placeholder="Chave secreta do app"
                    value={formData.appSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Token de Verificação</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Token para verificação do webhook"
                    value={formData.verifyToken}
                    onChange={(e) => setFormData(prev => ({ ...prev, verifyToken: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Atualizar' : 'Criar'} Integração
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configuração de Webhooks
              </CardTitle>
              <CardDescription>
                Configure os webhooks no Facebook Developer Console
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>URL do Webhook</AlertTitle>
                <AlertDescription>
                  Use esta URL no Facebook Developer Console:
                  <code className="block mt-2 p-2 bg-muted rounded text-sm">
                    {generateWebhookUrl()}
                  </code>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Eventos do Webhook</h4>
                <p className="text-sm text-muted-foreground">
                  Configure os seguintes eventos no Facebook Developer Console:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>messages (para mensagens do Messenger)</li>
                  <li>messaging_postbacks (para interações com botões)</li>
                  <li>messaging_optins (para opt-ins)</li>
                  <li>feed (para comentários e posts)</li>
                  <li>instagram (para Instagram Direct)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}