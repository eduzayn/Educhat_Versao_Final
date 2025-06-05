import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Switch } from '@/shared/ui/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/ui/ui/dialog';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Textarea } from '@/shared/ui/ui/textarea';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Key, Shield, Users, Settings, MessageSquare, BarChart, Database, Download, Plus, Edit, Trash2, Save, History } from 'lucide-react';

function getCategoryName(category: string) {
  const names: Record<string, string> = {
    'admin': 'Administração',
    'crm': 'CRM & Vendas',
    'conversations': 'Sistema de Chat',
    'comunicacao': 'Comunicação',
    'analytics': 'Relatórios e Análises',
    'administracao': 'Configurações',
    'other': 'Outras Permissões'
  };
  return names[category] || category;
}

function getCategoryDescription(category: string) {
  const descriptions: Record<string, string> = {
    'admin': 'Permissões administrativas e de gerenciamento',
    'crm': 'Permissões para contatos e negócios com controle hierárquico',
    'conversations': 'Permissões para conversas e atendimento',
    'comunicacao': 'Permissões para canais de comunicação',
    'analytics': 'Permissões para relatórios e análises',
    'administracao': 'Permissões de configuração do sistema',
    'other': 'Outras permissões do sistema'
  };
  return descriptions[category] || 'Permissões do sistema';
}

function getCategoryIcon(category: string) {
  const icons: Record<string, JSX.Element> = {
    'admin': <Users className="h-5 w-5" />,
    'crm': <Database className="h-5 w-5" />,
    'conversations': <MessageSquare className="h-5 w-5" />,
    'comunicacao': <Key className="h-5 w-5" />,
    'analytics': <BarChart className="h-5 w-5" />,
    'administracao': <Settings className="h-5 w-5" />,
    'other': <Shield className="h-5 w-5" />
  };
  return icons[category] || <Shield className="h-5 w-5" />;
}

export const PermissionsTab = () => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch permissions from database
  const { data: permissionsData = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/admin/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    }
  });

  // Fetch roles from database
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    }
  });

  // Fetch role permissions when role is selected
  const { data: rolePermissions = [], refetch: refetchRolePermissions } = useQuery({
    queryKey: ['/api/admin/role-permissions', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      const response = await fetch(`/api/admin/role-permissions/${selectedRoleId}`);
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      return response.json();
    },
    enabled: !!selectedRoleId
  });

  // Update selected permissions when role changes (only when role changes, not when permissions are updated)
  useEffect(() => {
    if (selectedRoleId) {
      setSelectedPermissions([]);
    }
  }, [selectedRoleId]);

  // Load initial permissions when rolePermissions data is fetched
  useEffect(() => {
    if (rolePermissions.length > 0) {
      const permissionNames = rolePermissions.map((rp: any) => rp.permission?.name || rp.permissionName).filter(Boolean);
      setSelectedPermissions(permissionNames);
    }
  }, [rolePermissions]); // Depend on rolePermissions data directly

  // Group permissions by category
  const permissionGroups = permissionsData.reduce((groups: any[], permission: any) => {
    const category = permission.category || 'other';
    let group = groups.find((g: any) => g.id === category);
    
    if (!group) {
      group = {
        id: category,
        name: getCategoryName(category),
        description: getCategoryDescription(category),
        icon: getCategoryIcon(category),
        permissions: []
      };
      groups.push(group);
    }
    
    group.permissions.push({
      id: permission.name,
      name: permission.displayName,
      description: permission.description
    });
    
    return groups;
  }, []);

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: string[] }) => {
      const response = await fetch('/api/admin/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: parseInt(roleId), permissions })
      });
      if (!response.ok) throw new Error('Failed to save permissions');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissões salvas",
        description: "As permissões foram atualizadas com sucesso.",
      });
      refetchRolePermissions();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (permission: { name: string; displayName: string; description: string; category: string }) => {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permission)
      });
      if (!response.ok) throw new Error('Failed to create permission');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissão criada",
        description: "Nova permissão criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      setIsEditDialogOpen(false);
      setEditingPermission(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePermissionToggle = (permissionId: string) => {
    console.log('Toggle permission:', permissionId);
    console.log('Current permissions:', selectedPermissions);
    
    setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      
      console.log('New permissions:', newPermissions);
      return newPermissions;
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) {
      toast({
        title: "Erro",
        description: "Selecione uma função primeiro.",
        variant: "destructive",
      });
      return;
    }

    savePermissionsMutation.mutate({ 
      roleId: selectedRoleId, 
      permissions: selectedPermissions 
    });
  };

  const handleCreatePermission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const permission = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string
    };

    createPermissionMutation.mutate(permission);
  };

  const getAllPermissions = () => {
    return permissionGroups.flatMap((g: any) => g.permissions.map((p: any) => p.id));
  };

  const handleSelectAll = () => {
    setSelectedPermissions(getAllPermissions());
  };

  const handleSelectNone = () => {
    setSelectedPermissions([]);
  };

  if (permissionsLoading || rolesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuração de Permissões</h3>
          <p className="text-sm text-muted-foreground">
            Configure permissões granulares para funções do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Permissão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Permissão</DialogTitle>
                <DialogDescription>
                  Defina uma nova permissão no sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePermission} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Permissão</Label>
                  <Input id="name" name="name" placeholder="ex: reports_view" required />
                </div>
                <div>
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input id="displayName" name="displayName" placeholder="ex: Visualizar Relatórios" required />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descreva o que esta permissão permite" />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administração</SelectItem>
                      <SelectItem value="crm">CRM & Vendas</SelectItem>
                      <SelectItem value="conversations">Sistema de Chat</SelectItem>
                      <SelectItem value="comunicacao">Comunicação</SelectItem>
                      <SelectItem value="analytics">Relatórios e Análises</SelectItem>
                      <SelectItem value="administracao">Configurações</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createPermissionMutation.isPending}>
                  {createPermissionMutation.isPending ? 'Criando...' : 'Criar Permissão'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Selecionar Função
          </CardTitle>
          <CardDescription>
            Escolha uma função para configurar suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="role">Função</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Limpar Seleção
              </Button>
            </div>
          </div>

          {selectedRoleId && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedPermissions.length} de {getAllPermissions().length} permissões selecionadas
              </div>
              <Button 
                onClick={handleSavePermissions}
                disabled={savePermissionsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {savePermissionsMutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Groups */}
      {selectedRoleId && (
        <div className="space-y-4">
          {permissionGroups.map((group: any) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {group.icon}
                  {group.name}
                  <Badge variant="secondary" className="ml-auto">
                    {group.permissions.filter((p: any) => selectedPermissions.includes(p.id)).length}/
                    {group.permissions.length}
                  </Badge>
                </CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.permissions.map((permission: any) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                          {permission.name}
                        </Label>
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
      )}

      {!selectedRoleId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma função para configurar suas permissões</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};