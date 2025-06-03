import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { Switch } from '@/shared/ui/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Mail, Server, Shield, AlertCircle } from 'lucide-react';

export function EmailTab() {
  const [isConnected, setIsConnected] = useState(false);
  const [autoRespond, setAutoRespond] = useState(false);
  const [smtpProvider, setSmtpProvider] = useState('');

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de E-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <Badge variant="secondary">Não Configurado</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Configure um servidor SMTP para envio de e-mails automáticos e notificações.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status SMTP</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">E-mails Hoje</Label>
              <p className="text-sm text-muted-foreground">
                {isConnected ? '12 enviados' : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Servidor SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp-provider">Provedor SMTP</Label>
            <Select value={smtpProvider} onValueChange={setSmtpProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook/Hotmail</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="ses">Amazon SES</SelectItem>
                <SelectItem value="custom">Servidor Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">Servidor SMTP</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Porta</Label>
              <Input
                id="smtp-port"
                placeholder="587"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-user">Usuário/E-mail</Label>
            <Input
              id="smtp-user"
              type="email"
              placeholder="seu-email@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-password">Senha/Token</Label>
            <Input
              id="smtp-password"
              type="password"
              placeholder="Sua senha ou token de aplicação"
            />
          </div>

          <div className="flex items-center gap-2 p-3 border border-blue-200 bg-blue-50 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Segurança</p>
              <p>Recomendamos usar tokens de aplicação específicos em vez de senhas principais.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button>
              Salvar Configurações
            </Button>
            <Button variant="outline">
              Testar Conexão
            </Button>
            <Button variant="outline">
              Enviar E-mail de Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de E-mail */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Envio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="from-name">Nome do Remetente</Label>
            <Input
              id="from-name"
              placeholder="Sua Empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-email">E-mail do Remetente</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="noreply@suaempresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-to">E-mail para Resposta</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="contato@suaempresa.com"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Respostas Automáticas</Label>
              <p className="text-sm text-muted-foreground">
                Enviar confirmação automática para novos e-mails recebidos
              </p>
            </div>
            <Switch checked={autoRespond} onCheckedChange={setAutoRespond} />
          </div>
        </CardContent>
      </Card>

      {/* Templates de E-mail */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de E-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Boas-vindas</p>
                <p className="text-sm text-muted-foreground">Template para novos contatos</p>
              </div>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Confirmação Automática</p>
                <p className="text-sm text-muted-foreground">Resposta automática para e-mails recebidos</p>
              </div>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Notificação de Ticket</p>
                <p className="text-sm text-muted-foreground">E-mail enviado quando um ticket é criado</p>
              </div>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Criar Novo Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}