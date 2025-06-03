import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Switch } from '@/shared/ui/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Separator } from '@/shared/ui/ui/separator';
import { Globe, Palette, Bell, Clock, Languages, Download } from 'lucide-react';

export const GeneralSettingsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configurações Regionais
          </CardTitle>
          <CardDescription>
            Configure idioma, fuso horário e formato de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma Padrão</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                  <SelectItem value="fr-FR">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select defaultValue="America/Sao_Paulo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-format">Formato de Data</Label>
              <Select defaultValue="dd/mm/yyyy">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                  <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select defaultValue="BRL">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Customize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select defaultValue="system">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accent-color">Cor Principal</Label>
            <Select defaultValue="blue">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Azul</SelectItem>
                <SelectItem value="green">Verde</SelectItem>
                <SelectItem value="purple">Roxo</SelectItem>
                <SelectItem value="orange">Laranja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">
                Reduzir espaçamento da interface
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como e quando receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sons de Notificação</Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som ao receber mensagens
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Enviar resumo diário por e-mail
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quiet-hours">Horário Silencioso</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="22:00" />
              <Input placeholder="08:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup e Exportação
          </CardTitle>
          <CardDescription>
            Gerencie backups e exportação de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Criar backup diário automaticamente
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="backup-retention">Retenção de Backup (dias)</Label>
            <Input id="backup-retention" type="number" defaultValue="30" />
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button variant="outline">Exportar Dados</Button>
            <Button variant="outline">Criar Backup Manual</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};