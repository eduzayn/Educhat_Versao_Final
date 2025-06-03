import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Shield, Plus, Users, Settings, Eye } from 'lucide-react';

const roles = [
  {
    id: 1,
    name: 'Administrador',
    description: 'Acesso total ao sistema, pode gerenciar todos os usuários e configurações',
    permissions: ['user_management', 'system_config', 'reports', 'channels'],
    userCount: 2,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  {
    id: 2,
    name: 'Gerente',
    description: 'Pode gerenciar equipes e acessar relatórios avançados',
    permissions: ['team_management', 'reports', 'user_view'],
    userCount: 5,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    id: 3,
    name: 'Supervisor',
    description: 'Supervisiona atendentes e pode acessar relatórios básicos',
    permissions: ['agent_supervision', 'basic_reports'],
    userCount: 3,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    id: 4,
    name: 'Atendente',
    description: 'Realiza atendimento aos clientes através dos canais configurados',
    permissions: ['chat_access', 'customer_view'],
    userCount: 14,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
];

const getPermissionName = (permission: string) => {
  const names = {
    user_management: 'Gerenciar Usuários',
    system_config: 'Configurar Sistema',
    reports: 'Relatórios Completos',
    channels: 'Gerenciar Canais',
    team_management: 'Gerenciar Equipes',
    user_view: 'Visualizar Usuários',
    agent_supervision: 'Supervisionar Atendentes',
    basic_reports: 'Relatórios Básicos',
    chat_access: 'Acesso ao Chat',
    customer_view: 'Visualizar Clientes'
  };
  return names[permission as keyof typeof names] || permission;
};

export const RolesTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Funções do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Configure as funções e permissões para diferentes tipos de usuários
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                <Badge variant="outline" className={role.color}>
                  {role.userCount} usuários
                </Badge>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Permissões:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map(permission => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {getPermissionName(permission)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};