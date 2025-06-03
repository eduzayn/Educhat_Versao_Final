import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Switch } from '@/shared/ui/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Key, Shield, Users, Settings, MessageSquare, BarChart, Database } from 'lucide-react';

const permissionGroups = [
  {
    id: 'users',
    name: 'Gerenciamento de Usuários',
    description: 'Permissões para gerenciar usuários e equipes',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { id: 'user_create', name: 'Criar usuários', description: 'Permitir criação de novos usuários' },
      { id: 'user_edit', name: 'Editar usuários', description: 'Permitir edição de dados de usuários' },
      { id: 'user_delete', name: 'Excluir usuários', description: 'Permitir exclusão de usuários' },
      { id: 'user_view', name: 'Visualizar usuários', description: 'Permitir visualização da lista de usuários' }
    ]
  },
  {
    id: 'system',
    name: 'Configurações do Sistema',
    description: 'Permissões para configurar o sistema',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { id: 'system_config', name: 'Configurar sistema', description: 'Acesso às configurações gerais' },
      { id: 'channel_config', name: 'Configurar canais', description: 'Gerenciar canais de comunicação' },
      { id: 'webhook_config', name: 'Configurar webhooks', description: 'Configurar integrações via webhook' },
      { id: 'security_config', name: 'Configurar segurança', description: 'Gerenciar configurações de segurança' }
    ]
  },
  {
    id: 'chat',
    name: 'Sistema de Chat',
    description: 'Permissões para uso do sistema de chat',
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: [
      { id: 'chat_access', name: 'Acessar chat', description: 'Permitir acesso ao sistema de chat' },
      { id: 'chat_assign', name: 'Atribuir conversas', description: 'Permitir atribuição de conversas' },
      { id: 'chat_transfer', name: 'Transferir conversas', description: 'Permitir transferência entre agentes' },
      { id: 'chat_history', name: 'Histórico completo', description: 'Visualizar histórico completo de conversas' }
    ]
  },
  {
    id: 'reports',
    name: 'Relatórios e Análises',
    description: 'Permissões para acessar relatórios',
    icon: <BarChart className="h-5 w-5" />,
    permissions: [
      { id: 'reports_view', name: 'Visualizar relatórios', description: 'Acesso aos relatórios básicos' },
      { id: 'reports_advanced', name: 'Relatórios avançados', description: 'Acesso aos relatórios avançados' },
      { id: 'reports_export', name: 'Exportar dados', description: 'Permitir exportação de relatórios' },
      { id: 'analytics_access', name: 'Análises avançadas', description: 'Acesso às ferramentas de análise' }
    ]
  },
  {
    id: 'data',
    name: 'Gerenciamento de Dados',
    description: 'Permissões para gerenciar dados do sistema',
    icon: <Database className="h-5 w-5" />,
    permissions: [
      { id: 'contacts_manage', name: 'Gerenciar contatos', description: 'Criar, editar e excluir contatos' },
      { id: 'conversations_manage', name: 'Gerenciar conversas', description: 'Gerenciar conversas e mensagens' },
      { id: 'backup_access', name: 'Backup e restauração', description: 'Acesso às funções de backup' },
      { id: 'import_export', name: 'Importar/Exportar', description: 'Importar e exportar dados' }
    ]
  }
];

export const PermissionsTab = () => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'user_view', 'chat_access', 'reports_view', 'contacts_manage'
  ]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getGroupPermissionCount = (groupPermissions: { id: string }[]) => {
    return groupPermissions.filter(p => selectedPermissions.includes(p.id)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciamento de Permissões</h3>
          <p className="text-sm text-muted-foreground">
            Configure permissões detalhadas para cada função do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Importar Template
          </Button>
          <Button>
            Salvar Configurações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {permissionGroups.map(group => (
          <Card key={group.id} className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {group.icon}
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </div>
                <Badge variant="outline">
                  {getGroupPermissionCount(group.permissions)}/{group.permissions.length}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {group.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.permissions.map(permission => (
                  <div key={permission.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{permission.name}</span>
                        <Switch
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Resumo de Permissões Selecionadas</CardTitle>
          </div>
          <CardDescription>
            Visualize todas as permissões atualmente selecionadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedPermissions.map(permissionId => {
              const permission = permissionGroups
                .flatMap(g => g.permissions)
                .find(p => p.id === permissionId);
              
              return permission ? (
                <Badge key={permissionId} variant="secondary" className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  {permission.name}
                </Badge>
              ) : null;
            })}
            {selectedPermissions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma permissão selecionada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};