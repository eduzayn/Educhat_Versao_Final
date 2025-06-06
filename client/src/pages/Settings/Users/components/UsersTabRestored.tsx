import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/ui/table';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Label } from '@/shared/ui/ui/label';
import { 
  Search, 
  UserPlus, 
  Users, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Shield,
  Key,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  dataKey?: string;
  channels: string[];
  macrosetores: string[];
  teamId?: number;
  team?: { id: number; name: string; };
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  macrosetor: string;
  color?: string;
  isActive: boolean;
}

export function UsersTabRestored() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    role: 'agent',
    isActive: true,
    dataKey: '',
    channels: [] as string[],
    macrosetores: [] as string[],
    teamId: undefined as number | undefined
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/system-users'],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: typeof newUserForm) => 
      apiRequest('/api/system-users', {
        method: 'POST',
        body: userData
      }),
    onSuccess: () => {
      setShowCreateDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar usuário"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) => 
      apiRequest(`/api/system-users/${id}`, {
        method: 'PUT',
        body: userData
      }),
    onSuccess: () => {
      setEditingUser(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/system-users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeletingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro", 
        description: error.message || "Erro ao excluir usuário"
      });
    }
  });

  const resetForm = () => {
    setNewUserForm({
      username: '',
      email: '',
      displayName: '',
      password: '',
      role: 'agent',
      isActive: true,
      dataKey: '',
      channels: [],
      macrosetores: [],
      teamId: undefined
    });
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUserForm);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({ 
      id: editingUser.id, 
      userData: newUserForm 
    });
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  const filteredUsers = (users as User[]).filter(user => {
    const matchesSearch = !searchQuery || 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive) ||
      (selectedStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'gerente': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      case 'agent': return 'Atendente';
      default: return role;
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Erro ao carregar usuários</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="agent">Atendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username} • {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.team ? (
                      <Badge variant="secondary">{user.team.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Sem equipe</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastActivityAt ? (
                      <span className="text-sm">
                        {new Date(user.lastActivityAt).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewUserForm({
                            username: user.username,
                            email: user.email,
                            displayName: user.displayName,
                            password: '',
                            role: user.role,
                            isActive: user.isActive,
                            dataKey: user.dataKey || '',
                            channels: user.channels || [],
                            macrosetores: user.macrosetores || [],
                            teamId: user.teamId
                          });
                          setEditingUser(user);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar Usuário */}
      <Dialog open={showCreateDialog || editingUser !== null} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingUser(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize as informações do usuário.' : 'Crie um novo usuário no sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuário
              </Label>
              <Input
                id="username"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                className="col-span-3"
                placeholder="Ex: joao.silva"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                className="col-span-3"
                placeholder="joao@exemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Nome
              </Label>
              <Input
                id="displayName"
                value={newUserForm.displayName}
                onChange={(e) => setNewUserForm({...newUserForm, displayName: e.target.value})}
                className="col-span-3"
                placeholder="João Silva"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                className="col-span-3"
                placeholder={editingUser ? "Nova senha (opcional)" : "Senha"}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({...newUserForm, role: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="agent">Atendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right">
                Equipe
              </Label>
              <Select 
                value={newUserForm.teamId?.toString() || "none"} 
                onValueChange={(value) => setNewUserForm({...newUserForm, teamId: value === "none" ? undefined : parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma equipe</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {editingUser ? 'Atualizar' : 'Criar'} Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmação de Exclusão */}
      <Dialog open={deletingUser !== null} onOpenChange={(open) => {
        if (!open) setDeletingUser(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deletingUser?.displayName}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}