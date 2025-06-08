import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Input } from '../../input';
import { Label } from '../../label';
import { Switch } from '../../switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Separator } from '../../separator';
import { Shield, Lock, Key, Users, AlertTriangle } from 'lucide-react';

export const SecuritySettingsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Políticas de Senha
          </CardTitle>
          <CardDescription>
            Configure requisitos de segurança para senhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length">Comprimento Mínimo</Label>
              <Input id="min-length" type="number" defaultValue="8" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Tentativas Máximas</Label>
              <Input id="max-attempts" type="number" defaultValue="5" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir Letras Maiúsculas</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter pelo menos uma letra maiúscula
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir Números</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter pelo menos um número
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir Símbolos</Label>
              <p className="text-sm text-muted-foreground">
                Senha deve conter pelo menos um símbolo especial
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Autenticação
          </CardTitle>
          <CardDescription>
            Configure métodos de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de Dois Fatores (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                Exigir verificação adicional no login
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
            <Select defaultValue="60">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="480">8 horas</SelectItem>
                <SelectItem value="1440">24 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Único (SSO)</Label>
              <p className="text-sm text-muted-foreground">
                Permitir login através de provedores externos
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Controle de Acesso
          </CardTitle>
          <CardDescription>
            Gerencie permissões e acessos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Log de Auditoria</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas as ações dos usuários
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ip-whitelist">Lista Branca de IPs</Label>
            <Input id="ip-whitelist" placeholder="192.168.1.0/24, 10.0.0.0/8" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloqueio por Localização</Label>
              <p className="text-sm text-muted-foreground">
                Bloquear acessos de países específicos
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves API
          </CardTitle>
          <CardDescription>
            Gerencie chaves de API do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-rate-limit">Limite de Requisições (por minuto)</Label>
            <Input id="api-rate-limit" type="number" defaultValue="1000" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rotação Automática de Chaves</Label>
              <p className="text-sm text-muted-foreground">
                Renovar chaves automaticamente a cada 30 dias
              </p>
            </div>
            <Switch />
          </div>
          
          <Button variant="outline" className="w-full">
            Gerar Nova Chave Mestra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};