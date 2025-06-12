import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useToast } from "@/shared/lib/hooks/use-toast";
import { 
  RefreshCw, 
  PlusCircle, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Mail, 
  MessageSquareText, 
  Phone,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { UnifiedChannelWizard } from './components/UnifiedChannelWizard';
import { ZApiStatusIndicator } from './components/ZApiStatusIndicator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { QRCodeCanvas } from "qrcode.react";
import type { Channel } from "@shared/schema";

interface ChannelFormData {
  name: string;
  type: string;
  instanceId: string;
  token: string;
  clientToken: string;
  webhookUrl?: string;
  description?: string;
}

const channelTypes = [
  {
    type: "whatsapp",
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    name: "WhatsApp",
    description: "Canal de comunicação via WhatsApp"
  },
  {
    type: "instagram", 
    icon: <Instagram className="h-5 w-5 text-pink-500" />,
    name: "Instagram",
    description: "Mensagens diretas no Instagram"
  },
  {
    type: "facebook",
    icon: <Facebook className="h-5 w-5 text-blue-600" />,
    name: "Facebook", 
    description: "Mensagens via Facebook Messenger"
  },
  {
    type: "email",
    icon: <Mail className="h-5 w-5 text-blue-500" />,
    name: "Email",
    description: "Canais de email para atendimento"
  },
  {
    type: "sms",
    icon: <MessageSquareText className="h-5 w-5 text-purple-500" />,
    name: "SMS",
    description: "Envio e recebimento de SMS"
  },
  {
    type: "voice",
    icon: <Phone className="h-5 w-5 text-amber-500" />,
    name: "Telefonia",
    description: "Atendimento telefônico integrado"
  }
];

export const ChannelsSettingsModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openAddChannelWizard, setOpenAddChannelWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [autoWebhookUrl, setAutoWebhookUrl] = useState<string>('');
  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  // Gerar URL do webhook automaticamente
  useEffect(() => {
    const generateWebhookUrl = () => {
      const currentUrl = window.location.origin;
      const webhookUrl = `${currentUrl}/api/webhook/zapi`;
      setAutoWebhookUrl(webhookUrl);
    };

    generateWebhookUrl();
  }, []);

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/channels'],
  });

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (data: ChannelFormData) => apiRequest('POST', '/api/channels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setOpenAddChannelWizard(false);
      toast({
        title: "Canal criado",
        description: "Canal criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar canal",
        variant: "destructive",
      });
    },
  });

  // Update channel mutation
  const updateMutation = useMutation({
    mutationFn: (data: ChannelFormData) => apiRequest('PUT', `/api/channels/${editingChannel?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setIsEditDialogOpen(false);
      setEditingChannel(null);
      toast({
        title: "Canal atualizado",
        description: "Canal atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar canal",
        variant: "destructive",
      });
    },
  });

  // Delete channel mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({
        title: "Canal excluído",
        description: "Canal excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir canal",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (channelId: number) => apiRequest('POST', `/api/channels/${channelId}/test`),
    onSuccess: (data: any) => {
      const isConnected = data?.connected || false;
      if (isConnected) {
        toast({
          title: "Conexão bem-sucedida",
          description: "Canal conectado com sucesso",
        });
      } else {
        toast({
          title: "Canal não conectado",
          description: "Use o botão 'Gerar QR Code' para conectar",
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
    },
    onError: () => {
      toast({
        title: "Erro de conexão",
        description: "Verifique as configurações do canal",
        variant: "destructive",
      });
    },
  });

  // Generate QR Code mutation
  const generateQrMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const response = await apiRequest('GET', `/api/channels/${channelId}/qrcode`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data?.qrCode) {
        setQrCodeData(data.qrCode);
        setIsQrDialogOpen(true);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o QR Code para conectar",
        });
      } else {
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível obter o QR Code",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Força uma verificação imediata do status Z-API
      const response = await fetch('/api/zapi/status');
      if (response.ok) {
        const data = await response.json();

        // Atualizar o store global com o status real
        // ZApi store removido - funcionalidade migrada para hooks consolidados
        const { setStatus, setConfigured } = await import('../../store/zapiStore').then(m => m.useZApiStore.getState());

        setStatus({
          connected: data.connected || false,
          session: data.session || false,
          smartphoneConnected: data.smartphoneConnected || false,
          lastUpdated: new Date()
        });

        // Se conectado, marcar como configurado
        if (data.connected) {
          setConfigured(true);
        }

        console.log('Status atualizado:', data);
      }

      // Atualizar lista de canais
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelAdded = (newChannel: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
    setOpenAddChannelWizard(false);
    toast({
      title: "Canal adicionado",
      description: `Canal ${newChannel.name} adicionado com sucesso`,
    });
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsEditDialogOpen(true);
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(autoWebhookUrl);
      setUrlCopied(true);
      toast({
        title: "URL copiada",
        description: "URL do webhook copiada para a área de transferência",
      });
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a URL",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (channel: Channel) => {
    if (channel.isConnected) {
      return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
    } else if (channel.connectionStatus === 'error') {
      return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Desconectado</Badge>;
    }
  };

  const renderChannelCard = (channelType: typeof channelTypes[0]) => {
    const existingChannels = Array.isArray(channels) ? channels.filter((ch: Channel) => ch.type === channelType.type) : [];

    return (
      <Card key={channelType.type} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channelType.icon}
              <div>
                <CardTitle className="text-lg">{channelType.name}</CardTitle>
                <CardDescription>{channelType.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existingChannels.length > 0 ? (
                <>
                  <Badge variant="outline">{existingChannels.length} canal(is)</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setOpenAddChannelWizard(true)}
                  >
                    Adicionar
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setOpenAddChannelWizard(true)}
                >
                  Configurar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {existingChannels.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {existingChannels.map((channel: Channel) => (
                <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-sm text-gray-600">
                        {channel.description || `Canal ${channel.type} - ID: ${channel.instanceId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(channel)}

                    {channel.type === 'whatsapp' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnectionMutation.mutate(channel.id)}
                          disabled={testConnectionMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          {channel.isConnected ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {testConnectionMutation.isPending ? 'Testando...' : 'Testar'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQrMutation.mutate(channel.id)}
                          disabled={generateQrMutation.isPending}
                        >
                          {generateQrMutation.isPending ? 'Gerando...' : 'QR Code'}
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditChannel(channel)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este canal?')) {
                          deleteMutation.mutate(channel.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando canais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Canais de Comunicação</h2>
          <p className="text-gray-600">
            Configure os canais de comunicação com seus clientes
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <ZApiStatusIndicator />
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </Button>
          <Button onClick={() => setOpenAddChannelWizard(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Canal
          </Button>
        </div>
      </div>

      {/* Grid de cards de canais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channelTypes.map(type => renderChannelCard(type))}
      </div>

      {/* Wizard de adição de canais */}
      <UnifiedChannelWizard 
        open={openAddChannelWizard}
        onOpenChange={setOpenAddChannelWizard}
        onChannelAdded={handleChannelAdded}
      />

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie este QR Code com seu WhatsApp para conectar o canal
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeData && (
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeCanvas 
                  value={qrCodeData}
                  size={256}
                  level="M"
                  includeMargin={true}
                  className="border rounded"
                />
              </div>
            )}
            <div className="text-center text-sm text-gray-600">
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Toque em Menu → Dispositivos conectados</p>
              <p>3. Toque em "Conectar um dispositivo"</p>
              <p>4. Aponte a câmera para este QR Code</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsQrDialogOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};