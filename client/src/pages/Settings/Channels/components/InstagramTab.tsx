import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { Switch } from '@/shared/ui/ui/switch';
import { Separator } from '@/shared/ui/ui/separator';
import { Instagram, Settings, Webhook, AlertCircle } from 'lucide-react';

export function InstagramTab() {
  const [isConnected, setIsConnected] = useState(false);
  const [autoRespond, setAutoRespond] = useState(false);

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram Business API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <Badge variant="secondary">Não Configurado</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Para conectar o Instagram, você precisa configurar uma conta Instagram Business 
            e conectá-la ao Facebook Business Manager.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensagens Hoje</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? '23 enviadas / 45 recebidas' : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Facebook Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-id">App ID do Facebook</Label>
            <Input
              id="app-id"
              placeholder="Seu App ID do Facebook Developer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-secret">App Secret</Label>
            <Input
              id="app-secret"
              type="password"
              placeholder="Seu App Secret do Facebook"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Token de acesso da página Instagram"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram-account">ID da Conta Instagram</Label>
            <Input
              id="instagram-account"
              placeholder="ID da conta Instagram Business"
            />
          </div>

          <div className="flex gap-3">
            <Button disabled>
              Conectar Instagram
            </Button>
            <Button variant="outline" disabled>
              Testar Conexão
            </Button>
          </div>

          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Atenção:</strong> A integração com Instagram requer aprovação do Facebook 
              para usar a Instagram Basic Display API ou Instagram Graph API. Este processo 
              pode levar alguns dias.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Comportamento */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Comportamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Respostas Automáticas</Label>
              <p className="text-sm text-muted-foreground">
                Ativar respostas automáticas para mensagens diretas
              </p>
            </div>
            <Switch checked={autoRespond} onCheckedChange={setAutoRespond} disabled />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Mensagem de Boas-vindas</Label>
            <textarea
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              placeholder="Digite a mensagem de boas-vindas para novos seguidores..."
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks do Instagram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div>
                <p className="font-medium">Mensagens Diretas</p>
                <p className="text-sm text-muted-foreground">Webhook para DMs recebidas</p>
              </div>
              <Badge variant="outline">
                Inativo
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div>
                <p className="font-medium">Comentários em Posts</p>
                <p className="text-sm text-muted-foreground">Notificações de novos comentários</p>
              </div>
              <Badge variant="outline">
                Inativo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div>
                <p className="font-medium">Menções em Stories</p>
                <p className="text-sm text-muted-foreground">Quando sua conta é mencionada</p>
              </div>
              <Badge variant="outline">
                Inativo
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full" disabled>
            Configurar Webhooks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}