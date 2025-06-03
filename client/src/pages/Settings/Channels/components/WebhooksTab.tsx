import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { Switch } from '@/shared/ui/ui/switch';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Webhook, Globe, Shield, Code, Activity, AlertCircle } from 'lucide-react';

export function WebhooksTab() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [logLevel, setLogLevel] = useState('info');

  const webhooks = [
    {
      id: 1,
      name: 'WhatsApp Mensagens',
      url: 'https://suaapi.com/webhook/whatsapp',
      events: ['message.received', 'message.sent'],
      status: 'active',
      lastCall: '2 minutos atrás'
    },
    {
      id: 2,
      name: 'Sistema de Tickets',
      url: 'https://suaapi.com/webhook/tickets',
      events: ['ticket.created', 'ticket.updated'],
      status: 'active',
      lastCall: '15 minutos atrás'
    },
    {
      id: 3,
      name: 'Notificações E-mail',
      url: 'https://suaapi.com/webhook/email',
      events: ['email.received'],
      status: 'inactive',
      lastCall: 'Nunca'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configurações Gerais de Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sistema de Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Ativar/desativar todos os webhooks do sistema
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-url">URL Base dos Webhooks</Label>
              <Input
                id="base-url"
                value="https://suaapi.com/webhooks"
                placeholder="https://seudominio.com/webhooks"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Chave Secreta</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Chave para validação de webhooks"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-level">Nível de Log</Label>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">Debug (Todos os eventos)</SelectItem>
                <SelectItem value="info">Info (Eventos importantes)</SelectItem>
                <SelectItem value="warn">Warn (Apenas avisos e erros)</SelectItem>
                <SelectItem value="error">Error (Apenas erros)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhooks Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{webhook.name}</h4>
                  <p className="text-sm text-muted-foreground">{webhook.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={webhook.status === 'active' ? 'default' : 'secondary'}
                    className={webhook.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Eventos: </span>
                  {webhook.events.join(', ')}
                </div>
                <div>
                  <span className="text-muted-foreground">Última chamada: </span>
                  {webhook.lastCall}
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full">
            Adicionar Novo Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Eventos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Eventos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { event: 'message.received', description: 'Nova mensagem recebida (WhatsApp, Email, etc.)' },
              { event: 'message.sent', description: 'Mensagem enviada com sucesso' },
              { event: 'message.failed', description: 'Falha no envio de mensagem' },
              { event: 'contact.created', description: 'Novo contato adicionado' },
              { event: 'contact.updated', description: 'Contato atualizado' },
              { event: 'ticket.created', description: 'Novo ticket criado' },
              { event: 'ticket.updated', description: 'Ticket atualizado ou status alterado' },
              { event: 'user.login', description: 'Usuário fez login no sistema' },
              { event: 'connection.status', description: 'Status de conexão dos canais alterado' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {item.event}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <Badge variant="outline">Disponível</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teste de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Teste de Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-url">URL de Teste</Label>
            <Input
              id="test-url"
              placeholder="https://webhook.site/seu-endpoint"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-payload">Payload de Teste (JSON)</Label>
            <Textarea
              id="test-payload"
              rows={6}
              placeholder={`{
  "event": "message.received",
  "data": {
    "id": "123",
    "from": "+5511999999999",
    "message": "Olá, teste de webhook!"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`}
            />
          </div>

          <div className="flex gap-3">
            <Button>
              Enviar Teste
            </Button>
            <Button variant="outline">
              Testar Todos os Webhooks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs e Monitoramento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs e Monitoramento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">847</p>
              <p className="text-sm text-muted-foreground">Sucessos Hoje</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">12</p>
              <p className="text-sm text-muted-foreground">Falhas Hoje</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">98.6%</p>
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Últimas Tentativas</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[
                { time: '08:45:12', webhook: 'WhatsApp Mensagens', status: 'success', response: '200 OK' },
                { time: '08:44:58', webhook: 'Sistema de Tickets', status: 'success', response: '200 OK' },
                { time: '08:44:23', webhook: 'Notificações E-mail', status: 'failed', response: '404 Not Found' },
                { time: '08:43:45', webhook: 'WhatsApp Mensagens', status: 'success', response: '200 OK' }
              ].map((log, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono">{log.time}</span>
                    <span>{log.webhook}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.response}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Ver Logs Completos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}