import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { Shield, Users, Database, MessageSquare, BarChart, Settings, RefreshCw, Save } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, JSX.Element> = {
    'admin': <Users className="h-5 w-5" />,
    'crm': <Database className="h-5 w-5" />,
    'conversations': <MessageSquare className="h-5 w-5" />,
    'analytics': <BarChart className="h-5 w-5" />,
    'administracao': <Settings className="h-5 w-5" />,
  };
  return icons[category] || <Shield className="h-5 w-5" />;
}

function getCategoryName(category: string) {
  const names: Record<string, string> = {
    'admin': 'Administração',
    'crm': 'CRM & Vendas',
    'conversations': 'Sistema de Chat',
    'analytics': 'Relatórios',
    'administracao': 'Configurações',
  };
  return names[category] || category;
}

// Lista de permissões nativas/críticas que devem ficar ocultas da interface
const SYSTEM_PERMISSIONS = [
  'sistema:acesso_total',
  'auth:login',
  'auth:logout', 
  'sistema:configuracao_critica',
  'database:backup',
  'database:restore',
  'servidor:reiniciar',
  'logs:sistema',
  'seguranca:auditoria'
];

// Permissões que são apenas para configuração por administradores técnicos
const TECHNICAL_PERMISSIONS = [
  'webhook:configurar',
  'api:gerenciar_chaves',
  'integracao:configurar'
];

export const PermissionsTab = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [showTechnicalPermissions, setShowTechnicalPermissions] = useState(false);
  const { toast } = useToast();

  // Buscar funções
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Erro ao buscar funções');
      return response.json();
    }
  });

  // Buscar permissões
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['/api/admin/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) throw new Error('Erro ao buscar permissões');
      return response.json();
    }
  });

  // Buscar permissões da função selecionada
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['/api/admin/role-permissions', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      const response = await fetch(`/api/admin/role-permissions/${selectedRoleId}`);
      if (!response.ok) throw new Error('Erro ao buscar permissões da função');
      return response.json();
    },
    enabled: !!selectedRoleId
  });

  // Mutation para atualizar permissões
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, hasPermission }: {
      roleId: number;
      permissionId: number;
      hasPermission: boolean;
    }) => {
      const method = hasPermission ? 'POST' : 'DELETE';
      const response = await fetch('/api/admin/role-permissions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissionId })
      });
      if (!response.ok) throw new Error('Erro ao atualizar permissão');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    }
  });

  // Verificar se a função tem uma permissão específica
  const hasPermission = (permissionId: number) => {
    return rolePermissions.some((rp: any) => rp.permissionId === permissionId);
  };

  // Alternar permissão
  const togglePermission = (permissionId: number, currentHasPermission: boolean) => {
    if (!selectedRoleId) return;
    
    updatePermissionMutation.mutate({
      roleId: parseInt(selectedRoleId),
      permissionId,
      hasPermission: !currentHasPermission
    });
  };

  // Filtrar permissões configuráveis (excluindo nativas e técnicas)
  const configurablePermissions = permissions.filter(permission => {
    const permissionKey = `${permission.resource}:${permission.action}`;
    
    // Sempre excluir permissões do sistema
    if (SYSTEM_PERMISSIONS.includes(permissionKey) || SYSTEM_PERMISSIONS.includes(permission.name)) {
      return false;
    }
    
    // Incluir permissões técnicas apenas se o usuário escolher visualizá-las
    if (TECHNICAL_PERMISSIONS.includes(permissionKey) || TECHNICAL_PERMISSIONS.includes(permission.name)) {
      return showTechnicalPermissions;
    }
    
    return true;
  });

  // Agrupar permissões configuráveis por categoria
  const groupedPermissions = configurablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Função */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuração de Permissões
          </CardTitle>
          <CardDescription>
            Selecione uma função para configurar suas permissões específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Função</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technical-toggle">Configurações Avançadas</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="technical-toggle"
                    checked={showTechnicalPermissions}
                    onCheckedChange={setShowTechnicalPermissions}
                  />
                  <Label htmlFor="technical-toggle" className="text-sm font-normal">
                    Mostrar permissões técnicas
                  </Label>
                </div>
              </div>
            </div>
            
            {selectedRoleId && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Configurando permissões para: <strong>{roles.find(r => r.id.toString() === selectedRoleId)?.name}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {configurablePermissions.length} permissões configuráveis disponíveis
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Object.keys(groupedPermissions).length} categorias
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissões por Categoria */}
      {selectedRoleId && (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {getCategoryName(category)}
                </CardTitle>
                <CardDescription>
                  {categoryPermissions.length} permissões disponíveis nesta categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {categoryPermissions.map((permission, index) => {
                    const currentHasPermission = hasPermission(permission.id);
                    const isTechnical = TECHNICAL_PERMISSIONS.includes(`${permission.resource}:${permission.action}`) || TECHNICAL_PERMISSIONS.includes(permission.name);
                    
                    return (
                      <div key={permission.id} className={`p-3 rounded-lg border ${currentHasPermission ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'} ${isTechnical ? 'border-orange-200 bg-orange-50/50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">
                                {permission.name}
                              </Label>
                              <div className="flex gap-1">
                                <Badge variant={permission.isActive ? "default" : "secondary"} className="text-xs">
                                  {permission.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                                {isTechnical && (
                                  <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                                    Técnica
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              {permission.resource}:{permission.action}
                            </p>
                          </div>
                          <Switch
                            checked={currentHasPermission}
                            onCheckedChange={() => togglePermission(permission.id, currentHasPermission)}
                            disabled={updatePermissionMutation.isPending || !permission.isActive}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!selectedRoleId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione uma Função</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Escolha uma função acima para visualizar e configurar suas permissões específicas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Permissões */}
      {selectedRoleId && rolePermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Resumo de Permissões
            </CardTitle>
            <CardDescription>
              Total de {rolePermissions.length} permissões ativas para esta função
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {rolePermissions.map((rp: any) => (
                <Badge key={rp.id} variant="outline" className="justify-start">
                  {rp.permissionName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};