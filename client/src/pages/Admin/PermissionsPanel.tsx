import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { Shield, Users, Settings, Edit } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  permissions: Permission[];
}

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  roleId: number;
  teamId: number;
  team: string;
  dataKey: string;
  channels: string[];
  macrosetores: string[];
  isActive: boolean;
  status: string;
  isOnline: boolean;
  lastLoginAt: string;
  lastActivityAt: string;
  createdAt: string;
  roleName: string;
  roleDescription: string;
}

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId: string;
  channel: string;
  macrosetor: string;
  dataKey: string;
  details: any;
  ipAddress: string;
  result: string;
  createdAt: string;
  userName: string;
  userEmail: string;
}

interface Stats {
  users: {
    total: number;
    active: number;
    online: number;
  };
  roles: number;
  permissions: number;
  teams: number;
  recentActivity: any[];
}

export default function PermissionsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar permissões
  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['/api/admin/permissions'],
  });

  // Buscar roles
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['/api/admin/roles'],
  });

  // Buscar usuários
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Buscar logs de auditoria
  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
  });

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Mutation para atualizar permissões de role
  const updateRolePermissions = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      await apiRequest(`/api/admin/roles/${roleId}/permissions`, 'PUT', { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso"
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissões",
        variant: "destructive"
      });
    }
  });

  const handleEditRolePermissions = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map(p => p.id));
    setIsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      updateRolePermissions.mutate({
        roleId: selectedRole.id,
        permissionIds: selectedPermissions
      });
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getPermissionsByCategory = (category: string) => {
    return Array.isArray(permissions) ? (permissions as Permission[]).filter((p: Permission) => p.category === category) : [];
  };

  const categories = Array.isArray(permissions) ? Array.from(new Set((permissions as Permission[]).map((p: Permission) => p.category))) : [];

  if (loadingPermissions || loadingRoles || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando painel administrativo...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie permissões, funções e usuários do sistema</p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as Stats).users.total}</div>
              <p className="text-xs text-muted-foreground">
                {(stats as Stats).users.active} ativos, {(stats as Stats).users.online} online
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funções</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as Stats).roles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissões</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as Stats).permissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as Stats).teams}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Funções</CardTitle>
              <CardDescription>
                Configure permissões para cada função do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Função</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(roles) && (roles as Role[]).map((role: Role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((perm: Permission) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRolePermissions(role)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissões do Sistema</CardTitle>
              <CardDescription>
                Todas as permissões disponíveis no sistema organizadas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {getPermissionsByCategory(category).map((permission: Permission) => (
                        <Card key={permission.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{permission.name}</div>
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
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Visualize usuários cadastrados e suas funções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.roleName || user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.team || "Não definida"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          {user.isOnline && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Online
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "Nunca"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico de ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: AuditLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        <Badge variant={log.result === 'success' ? "default" : "destructive"}>
                          {log.result}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar permissões de função */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Permissões - {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Selecione as permissões que esta função deve ter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {getPermissionsByCategory(category).map((permission: Permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`permission-${permission.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={updateRolePermissions.isPending}
            >
              {updateRolePermissions.isPending ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}