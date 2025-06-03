import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Trash2, TestTube, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Channel } from '@shared/schema';

interface ChannelFormData {
  name: string;
  type: string;
  instanceId: string;
  token: string;
  clientToken: string;
  webhookUrl?: string;
  description?: string;
}

export default function ChannelsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; channelId: number | null }>({ open: false, channelId: null });
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['/api/channels'],
  });

  const createChannelMutation = useMutation({
    mutationFn: (data: ChannelFormData) => apiRequest('/api/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Canal criado',
        description: 'O canal WhatsApp foi criado com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao criar o canal.',
      });
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, ...data }: ChannelFormData & { id: number }) => 
      apiRequest(`/api/channels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setIsEditDialogOpen(false);
      setSelectedChannel(null);
      toast({
        title: 'Canal atualizado',
        description: 'O canal foi atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar o canal.',
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/channels/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({
        title: 'Canal excluído',
        description: 'O canal foi excluído com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir o canal.',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/channels/${id}/test-connection`, {
      method: 'POST',
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({
        title: data.connected ? 'Conexão ativa' : 'Conexão inativa',
        description: data.connected ? 'O canal está conectado e funcionando.' : 'O canal não está conectado.',
        variant: data.connected ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao testar a conexão.',
      });
    },
  });

  const getQrCodeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/channels/${id}/qr-code`),
    onSuccess: (data) => {
      setQrCodeData(data.qrCode);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao obter QR Code.',
      });
    },
  });

  const handleCreateChannel = (formData: FormData) => {
    const data: ChannelFormData = {
      name: formData.get('name') as string,
      type: 'whatsapp',
      instanceId: formData.get('instanceId') as string,
      token: formData.get('token') as string,
      clientToken: formData.get('clientToken') as string,
      webhookUrl: formData.get('webhookUrl') as string || undefined,
      description: formData.get('description') as string || undefined,
    };
    createChannelMutation.mutate(data);
  };

  const handleUpdateChannel = (formData: FormData) => {
    if (!selectedChannel) return;
    
    const data: ChannelFormData & { id: number } = {
      id: selectedChannel.id,
      name: formData.get('name') as string,
      type: 'whatsapp',
      instanceId: formData.get('instanceId') as string,
      token: formData.get('token') as string,
      clientToken: formData.get('clientToken') as string,
      webhookUrl: formData.get('webhookUrl') as string || undefined,
      description: formData.get('description') as string || undefined,
    };
    updateChannelMutation.mutate(data);
  };

  const handleEditChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsEditDialogOpen(true);
  };

  const handleDeleteChannel = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este canal?')) {
      deleteChannelMutation.mutate(id);
    }
  };

  const handleGetQrCode = (id: number) => {
    setQrCodeDialog({ open: true, channelId: id });
    setQrCodeData(null);
    getQrCodeMutation.mutate(id);
  };

  const getStatusBadge = (channel: Channel) => {
    if (channel.isConnected) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando canais...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canais WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie múltiplos canais WhatsApp com credenciais independentes</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Canal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Canal</DialogTitle>
              <DialogDescription>
                Configure um novo canal WhatsApp com suas credenciais da Z-API
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateChannel(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Canal</Label>
                <Input id="name" name="name" placeholder="Ex: Vendas Principal" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instanceId">Instance ID</Label>
                <Input id="instanceId" name="instanceId" placeholder="Seu Instance ID da Z-API" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input id="token" name="token" placeholder="Seu Token da Z-API" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientToken">Client Token</Label>
                <Input id="clientToken" name="clientToken" placeholder="Seu Client Token da Z-API" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Opcional)</Label>
                <Input id="webhookUrl" name="webhookUrl" placeholder="URL do webhook personalizada" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea id="description" name="description" placeholder="Descrição do canal" />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createChannelMutation.isPending}>
                  {createChannelMutation.isPending ? 'Criando...' : 'Criar Canal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum canal configurado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Configure seu primeiro canal WhatsApp para começar a usar o sistema
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Canal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel: Channel) => (
            <Card key={channel.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{channel.name}</CardTitle>
                  {getStatusBadge(channel)}
                </div>
                <CardDescription>
                  {channel.description || 'Canal WhatsApp'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Instance ID:</span> {channel.instanceId}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {channel.type}
                  </div>
                  {channel.lastConnectionCheck && (
                    <div>
                      <span className="font-medium">Última verificação:</span>{' '}
                      {new Date(channel.lastConnectionCheck).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate(channel.id)}
                    disabled={testConnectionMutation.isPending}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Testar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGetQrCode(channel.id)}
                    disabled={getQrCodeMutation.isPending}
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    QR Code
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditChannel(channel)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteChannel(channel.id)}
                    disabled={deleteChannelMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Channel Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Canal</DialogTitle>
            <DialogDescription>
              Atualize as configurações do canal WhatsApp
            </DialogDescription>
          </DialogHeader>
          {selectedChannel && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateChannel(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Canal</Label>
                <Input id="edit-name" name="name" defaultValue={selectedChannel.name} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-instanceId">Instance ID</Label>
                <Input id="edit-instanceId" name="instanceId" defaultValue={selectedChannel.instanceId} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-token">Token</Label>
                <Input id="edit-token" name="token" defaultValue={selectedChannel.token} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-clientToken">Client Token</Label>
                <Input id="edit-clientToken" name="clientToken" defaultValue={selectedChannel.clientToken} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-webhookUrl">Webhook URL (Opcional)</Label>
                <Input id="edit-webhookUrl" name="webhookUrl" defaultValue={selectedChannel.webhookUrl || ''} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição (Opcional)</Label>
                <Textarea id="edit-description" name="description" defaultValue={selectedChannel.description || ''} />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateChannelMutation.isPending}>
                  {updateChannelMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog.open} onOpenChange={(open) => setQrCodeDialog({ open, channelId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do Canal</DialogTitle>
            <DialogDescription>
              Escaneie este QR Code no WhatsApp para conectar o canal
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {getQrCodeMutation.isPending ? (
              <div className="flex items-center justify-center h-64 w-64 border rounded-lg">
                <div className="text-sm text-muted-foreground">Gerando QR Code...</div>
              </div>
            ) : qrCodeData ? (
              <img src={qrCodeData} alt="QR Code" className="w-64 h-64 border rounded-lg" />
            ) : (
              <div className="flex items-center justify-center h-64 w-64 border rounded-lg">
                <div className="text-sm text-muted-foreground">QR Code não disponível</div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp no seu celular e escaneie este código para conectar o canal
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}