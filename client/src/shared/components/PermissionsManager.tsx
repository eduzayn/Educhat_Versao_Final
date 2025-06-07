import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Switch } from '@/shared/ui/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Label } from '@/shared/ui/ui/label';
import { Separator } from '@/shared/ui/ui/separator';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { Shield, RefreshCw, Save } from 'lucide-react';
import { 
  renderPermissionBadges, 
  filterPermissionsByCategory, 
  groupPermissionsByModule,
  getRoleStatusBadge,
  SYSTEM_MODULES 
} from '@/shared/lib/utils/permissionHelpers';

interface Permission {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  category: string;
  resource: string;
  action: string;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  displayName?: string;
  isActive: boolean;
  permissions: Permission[];
}

interface PermissionsManagerProps {
  mode?: 'role-permissions' | 'permission-overview';
  roleId?: number;
  className?: string;
}

export function PermissionsManager({ 
  mode = 'role-permissions', 
  roleId, 
  className = '' 
}: PermissionsManagerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roleId?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    enabled: !!selectedRoleId && mode === 'role-permissions'
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

  // Agrupar permissões por categoria
  const groupedPermissions = groupPermissionsByModule(permissions);
  const filteredPermissions = filterPermissionsByCategory(permissions, selectedCategory);

  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    const module = SYSTEM_MODULES[category as keyof typeof SYSTEM_MODULES];
    return module ? <module.icon className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getCategoryName = (category: string) => {
    const module = SYSTEM_MODULES[category as keyof typeof SYSTEM_MODULES];
    return module ? module.name : category;
  };

  if (mode === 'permission-overview') {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Permissões do Sistema</CardTitle>
            <CardDescription>
              Todas as permissões disponíveis no sistema organizadas por módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                <div key={module} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(module)}
                    <h3 className="text-lg font-semibold">{getCategoryName(module)}</h3>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {modulePermissions.map((permission) => (
                      <Card key={permission.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{permission.displayName || permission.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {permission.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {permission.resource}:{permission.action}
                            </div>
                          </div>
                          <Badge variant={permission.isActive ? "default" : "secondary"}>
                            {permission.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
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
            <div className="space-y-2">
              <Label htmlFor="role-select">Função</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRoleId && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Configurando permissões para: <strong>
                    {roles.find(r => r.id.toString() === selectedRoleId)?.displayName || 
                     roles.find(r => r.id.toString() === selectedRoleId)?.name}
                  </strong>
                </p>
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
                  {categoryPermissions.length} permissões disponíveis neste módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryPermissions.map((permission, index) => {
                    const currentHasPermission = hasPermission(permission.id);
                    
                    return (
                      <div key={permission.id}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-base font-medium">
                                {permission.displayName || permission.name}
                              </Label>
                              <Badge variant={permission.isActive ? "default" : "secondary"}>
                                {permission.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {permission.resource}:{permission.action}
                            </p>
                          </div>
                          <Switch
                            checked={currentHasPermission}
                            onCheckedChange={() => togglePermission(permission.id, currentHasPermission)}
                            disabled={updatePermissionMutation.isPending || !permission.isActive}
                          />
                        </div>
                        {index < categoryPermissions.length - 1 && <Separator className="mt-4" />}
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
}