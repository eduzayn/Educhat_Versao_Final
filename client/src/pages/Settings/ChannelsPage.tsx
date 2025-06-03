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

  // Fetch channels
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['/api/channels'],
  });

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (data: ChannelFormData) => apiRequest('/api/channels', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
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
    mutationFn: (data: ChannelFormData) => apiRequest(`/api/channels/${editingChannel?.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
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
    mutationFn: (id: number) => apiRequest(`/api/channels/${id}`, {
      method: 'DELETE'
    }),
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
    mutationFn: (channelId: number) => apiRequest(`/api/channels/${channelId}/test`, {
      method: 'POST'
    }),
    onSuccess: (data: any) => {
      const isConnected = data?.connected || false;
      toast({
        title: isConnected ? "Conexão bem-sucedida" : "Falha na conexão",
        description: isConnected ? "Canal conectado com sucesso" : "Erro ao conectar com o canal",
        variant: isConnected ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao testar conexão",
        variant: "destructive",
      });
    },
  });

  // Generate QR Code mutation
  const generateQrMutation = useMutation({
    mutationFn: (channelId: number) => apiRequest(`/api/channels/${channelId}/qr`, {
      method: 'POST'
    }),
    onSuccess: (data: any) => {
      if (data?.qrCode) {
        toast({
          title: "QR Code gerado",
          description: "QR Code gerado com sucesso",
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
                    onClick={() => generateQrMutation.mutate(channel.id)}
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
      </div>
    </div>
  );
}