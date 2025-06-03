import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/shared/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/ui/card";
import { Badge } from "@/shared/ui/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/ui/dialog";
import { Input } from "@/shared/ui/ui/input";
import { Label } from "@/shared/ui/ui/label";
import { Textarea } from "@/shared/ui/ui/textarea";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { ArrowLeft, Plus, Settings, Trash2, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
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

export default function ChannelsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  // Fetch channels
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['/api/channels'],
  });

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (data: ChannelFormData) => apiRequest('POST', '/api/channels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Canal criado",
        description: "Canal WhatsApp criado com sucesso",
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
        description: "Canal WhatsApp atualizado com sucesso",
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
        description: "Canal WhatsApp excluído com sucesso",
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
          description: "Canal WhatsApp conectado com sucesso",
        });
      } else {
        // Em vez de mostrar erro, oferece opção de conectar via QR Code
        toast({
          title: "WhatsApp não conectado",
          description: "Use o botão 'Gerar QR Code' para conectar o WhatsApp",
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
    },
    onError: () => {
      toast({
        title: "Erro de conexão",
        description: "Verifique as configurações da Z-API",
        variant: "destructive",
      });
    },
  });

  // Generate QR Code mutation
  const generateQrMutation = useMutation({
    mutationFn: () => apiRequest('GET', '/api/zapi/qrcode'),
    onSuccess: (data: any) => {
      console.log('QR Code response:', data);
      if (data?.qrCode) {
        setQrCodeData(data.qrCode);
        setIsQrDialogOpen(true);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o QR Code com seu WhatsApp para conectar",
        });
      } else {
        console.error('QR Code not found in response:', data);
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível obter o QR Code da Z-API",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('QR Code generation error:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code",
        variant: "destructive",
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
      webhookUrl: formData.get('webhookUrl') as string,
      description: formData.get('description') as string,
    };
    createMutation.mutate(data);
  };

  const handleUpdateChannel = (formData: FormData) => {
    if (!editingChannel) return;
    
    const data: ChannelFormData = {
      name: formData.get('name') as string,
      type: 'whatsapp',
      instanceId: formData.get('instanceId') as string,
      token: formData.get('token') as string,
      clientToken: formData.get('clientToken') as string,
      webhookUrl: formData.get('webhookUrl') as string,
      description: formData.get('description') as string,
    };
    updateMutation.mutate(data);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsEditDialogOpen(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary mx-auto mb-4"></div>
          <p className="text-educhat-medium">Carregando canais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/settings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-educhat-dark">Gerenciar Canais</h1>
            <p className="text-educhat-medium">Configure e gerencie múltiplos canais WhatsApp</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-educhat-primary" />
            <span className="text-lg font-medium text-educhat-dark">
              Canais WhatsApp ({Array.isArray(channels) ? channels.length : 0})
            </span>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Canal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Canal WhatsApp</DialogTitle>
                <DialogDescription>
                  Configure um novo canal WhatsApp com credenciais da Z-API
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateChannel(new FormData(e.target as HTMLFormElement));
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Canal</Label>
                  <Input id="name" name="name" placeholder="Ex: WhatsApp Principal" required />
                </div>
                <div>
                  <Label htmlFor="instanceId">Instance ID</Label>
                  <Input id="instanceId" name="instanceId" placeholder="Ex: 3DF871A7ADFB20FB49998E66062CE0C1" required />
                </div>
                <div>
                  <Label htmlFor="token">Token</Label>
                  <Input id="token" name="token" placeholder="Ex: A4E42029C248B72DA0842F47" required />
                </div>
                <div>
                  <Label htmlFor="clientToken">Client Token</Label>
                  <Input id="clientToken" name="clientToken" placeholder="Ex: F3A2B1C4D5E6F7G8H9I0J1K2L3M4" required />
                </div>
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL (Opcional)</Label>
                  <Input id="webhookUrl" name="webhookUrl" placeholder="https://seu-webhook.com/api" />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descrição do canal" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Criando...' : 'Criar Canal'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {Array.isArray(channels) && channels.map((channel: Channel) => (
            <Card key={channel.id} className="border border-educhat-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <CardDescription>
                        {channel.description || `Canal ${channel.type} - ID: ${channel.instanceId}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(channel)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-educhat-dark">Instance ID</p>
                    <p className="text-sm text-educhat-medium font-mono">
                      {channel.instanceId || 'Não configurado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-educhat-dark">Token</p>
                    <p className="text-sm text-educhat-medium font-mono">
                      {channel.token ? `${channel.token.substring(0, 8)}...` : 'Não configurado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-educhat-dark">Client Token</p>
                    <p className="text-sm text-educhat-medium font-mono">
                      {channel.clientToken ? `${channel.clientToken.substring(0, 8)}...` : 'Não configurado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
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
                    {testConnectionMutation.isPending ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQrMutation.mutate()}
                    disabled={generateQrMutation.isPending}
                  >
                    {generateQrMutation.isPending ? 'Gerando...' : 'Gerar QR Code'}
                  </Button>
                  
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
              </CardContent>
            </Card>
          ))}
          
          {!Array.isArray(channels) || channels.length === 0 && (
            <Card className="border border-educhat-border">
              <CardContent className="text-center py-8">
                <Settings className="h-12 w-12 text-educhat-medium mx-auto mb-4" />
                <h3 className="text-lg font-medium text-educhat-dark mb-2">Nenhum canal configurado</h3>
                <p className="text-educhat-medium mb-4">Crie seu primeiro canal WhatsApp para começar</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Canal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open: boolean) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingChannel(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Canal WhatsApp</DialogTitle>
              <DialogDescription>
                Atualize as configurações do canal WhatsApp
              </DialogDescription>
            </DialogHeader>
            {editingChannel && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateChannel(new FormData(e.target as HTMLFormElement));
              }} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome do Canal</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    defaultValue={editingChannel.name}
                    placeholder="Ex: WhatsApp Principal" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-instanceId">Instance ID</Label>
                  <Input 
                    id="edit-instanceId" 
                    name="instanceId" 
                    defaultValue={editingChannel.instanceId || ''}
                    placeholder="Ex: 3DF871A7ADFB20FB49998E66062CE0C1" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-token">Token</Label>
                  <Input 
                    id="edit-token" 
                    name="token" 
                    defaultValue={editingChannel.token || ''}
                    placeholder="Ex: A4E42029C248B72DA0842F47" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-clientToken">Client Token</Label>
                  <Input 
                    id="edit-clientToken" 
                    name="clientToken" 
                    defaultValue={editingChannel.clientToken || ''}
                    placeholder="Ex: F3A2B1C4D5E6F7G8H9I0J1K2L3M4" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-webhookUrl">Webhook URL (Opcional)</Label>
                  <Input 
                    id="edit-webhookUrl" 
                    name="webhookUrl" 
                    defaultValue={editingChannel.webhookUrl || ''}
                    placeholder="https://seu-webhook.com/api" 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    defaultValue={editingChannel.description || ''}
                    placeholder="Descrição do canal" 
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

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
                  <img 
                    src={qrCodeData} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
              )}
              <div className="text-center text-sm text-educhat-medium">
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
    </div>
  );
}