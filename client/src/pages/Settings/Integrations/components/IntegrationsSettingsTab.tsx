import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Input } from '../../input';
import { Label } from '../../label';
import { Switch } from '../../switch';
import { Badge } from '../../badge';
import { Separator } from '../../separator';
import { Zap, MessageSquare, Webhook, Smartphone, Mail, Calendar } from 'lucide-react';

export const IntegrationsSettingsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configure integração com WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Status da Integração</Label>
              <p className="text-sm text-muted-foreground">
                WhatsApp Business API está conectado
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp-token">Token da API</Label>
            <Input id="whatsapp-token" type="password" placeholder="•••••••••••••••" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone">Número de Telefone</Label>
            <Input id="whatsapp-phone" placeholder="+55 11 99999-9999" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Webhook Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Receber mensagens em tempo real
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Button variant="outline">Testar Conexão</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Configure webhooks para integrações externas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input id="webhook-url" placeholder="https://api.exemplo.com/webhook" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Chave Secreta</Label>
            <Input id="webhook-secret" type="password" placeholder="•••••••••••••••" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Retry Automático</Label>
              <p className="text-sm text-muted-foreground">
                Tentar novamente em caso de falha
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Button variant="outline">Enviar Teste</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Integração de E-mail
          </CardTitle>
          <CardDescription>
            Configure provedores de e-mail para notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SendGrid</Label>
              <p className="text-sm text-muted-foreground">
                Provedor de e-mail para notificações
              </p>
            </div>
            <Badge variant="secondary">Não configurado</Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sendgrid-key">Chave API SendGrid</Label>
            <Input id="sendgrid-key" type="password" placeholder="•••••••••••••••" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mailgun</Label>
              <p className="text-sm text-muted-foreground">
                Provedor alternativo de e-mail
              </p>
            </div>
            <Badge variant="secondary">Não configurado</Badge>
          </div>
          
          <Button variant="outline">Configurar Provedor</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Outras Integrações
          </CardTitle>
          <CardDescription>
            Configure integrações com outros serviços
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Google Calendar</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar eventos e agendamentos
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Slack</Label>
              <p className="text-sm text-muted-foreground">
                Notificações para canal do Slack
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Zapier</Label>
              <p className="text-sm text-muted-foreground">
                Automações via Zapier
              </p>
            </div>
            <Switch />
          </div>
          
          <Button variant="outline">Explorar Mais Integrações</Button>
        </CardContent>
      </Card>
    </div>
  );
};