import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Input } from '../../input';
import { Label } from '../../label';
import { Switch } from '../../switch';
import { Separator } from '../../separator';
import { Settings, Database, Globe, Mail } from 'lucide-react';

export const SystemSettingsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais do Sistema
          </CardTitle>
          <CardDescription>
            Configure parâmetros básicos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input id="company-name" placeholder="EduChat" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-url">URL do Sistema</Label>
              <Input id="system-url" placeholder="https://educhat.com" />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Ativar modo de manutenção do sistema
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registro de Usuários</Label>
              <p className="text-sm text-muted-foreground">
                Permitir novos registros de usuários
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações de Banco de Dados
          </CardTitle>
          <CardDescription>
            Gerencie configurações do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db-host">Host do Banco</Label>
              <Input id="db-host" placeholder="localhost" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-port">Porta</Label>
              <Input id="db-port" placeholder="5432" />
            </div>
          </div>
          
          <Button variant="outline">Testar Conexão</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de E-mail
          </CardTitle>
          <CardDescription>
            Configure servidor SMTP para envio de e-mails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">Servidor SMTP</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Porta SMTP</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Usuário</Label>
              <Input id="smtp-user" placeholder="usuario@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from">E-mail Remetente</Label>
              <Input id="smtp-from" placeholder="noreply@educhat.com" />
            </div>
          </div>
          
          <Button variant="outline">Enviar E-mail de Teste</Button>
        </CardContent>
      </Card>
    </div>
  );
};