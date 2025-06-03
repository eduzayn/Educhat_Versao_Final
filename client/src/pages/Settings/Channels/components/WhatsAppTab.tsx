import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { Switch } from '@/shared/ui/ui/switch';
import { Separator } from '@/shared/ui/ui/separator';
import { AlertCircle, CheckCircle, Smartphone, QrCode, Settings, Webhook } from 'lucide-react';
import { ZApiStatusIndicator } from '@/shared/components/ZApiStatusIndicator';

export function WhatsAppTab() {
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [autoRespond, setAutoRespond] = useState(true);
  const [readConfirmation, setReadConfirmation] = useState(true);

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status da Conexão WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ZApiStatusIndicator isConnected={isConnected} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Último Sync</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Há 2 minutos' : 'Nunca sincronizado'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensagens Hoje</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? '847 enviadas / 1,203 recebidas' : '0'}
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
            Configurações Z-API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instance-id">Instance ID</Label>
              <Input
                id="instance-id"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="Seu Instance ID da Z-API"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Seu token da Z-API"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seudominio.com/webhook/zapi"
            />
            <p className="text-xs text-muted-foreground">
              URL onde os webhooks da Z-API serão enviados
            </p>
          </div>

          <div className="flex gap-3">
            <Button className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Testar Conexão
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Gerar QR Code
            </Button>
            <Button variant="outline">
              Salvar Configurações
            </Button>
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
                Ativar respostas automáticas para mensagens fora do horário
              </p>
            </div>
            <Switch checked={autoRespond} onCheckedChange={setAutoRespond} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Confirmação de Leitura</Label>
              <p className="text-sm text-muted-foreground">
                Enviar automaticamente confirmação de leitura para mensagens
              </p>
            </div>
            <Switch checked={readConfirmation} onCheckedChange={setReadConfirmation} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Horário de Funcionamento</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm">Início</Label>
                <Input id="start-time" type="time" defaultValue="08:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm">Fim</Label>
                <Input id="end-time" type="time" defaultValue="18:00" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configurações de Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Mensagens Recebidas</p>
                <p className="text-sm text-muted-foreground">Webhook para novas mensagens</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ativo
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Status de Entrega</p>
                <p className="text-sm text-muted-foreground">Confirmações de entrega e leitura</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Conectividade</p>
                <p className="text-sm text-muted-foreground">Status de conexão da instância</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ativo
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Testar Todos os Webhooks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}