import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Checkbox } from '@/shared/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/ui/alert-dialog';
import { Label } from '@/shared/ui/label';
import { 
  Search, 
  UserPlus, 
  Users, 
  UserCheck, 
  Activity, 
  Clock, 
  MoreHorizontal, 
  Edit, 
  Key, 
  UserX, 
  Trash, 
  Mail, 
  Building2,
  Upload,
  Download
} from 'lucide-react';



const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'Administrador':
    case 'administrador':
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'Gerente':
    case 'gerente':
    case 'manager':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'supervisor':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'Atendente':
    case 'atendente':
    case 'agent':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Visualizador':
    case 'visualizador':
    case 'viewer':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getRoleDisplayName = (role: string) => {
  const roleNames = {
    admin: 'Administrador',
    administrador: 'Administrador',
    Administrador: 'Administrador',
    manager: 'Gerente',
    gerente: 'Gerente',
    Gerente: 'Gerente',
    supervisor: 'Supervisor',
    agent: 'Atendente',
    atendente: 'Atendente',
    Atendente: 'Atendente',
    viewer: 'Visualizador',
    visualizador: 'Visualizador',
    Visualizador: 'Visualizador'
  };
  return roleNames[role as keyof typeof roleNames] || role;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'inactive':
      return 'bg-red-500';
    case 'pending':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const formatDistanceToNow = (date: Date | null | string) => {
  if (!date) return 'Nunca';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Nunca';
  
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Agora mesmo';
  if (diffInHours < 24) return `há ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

export const UsersTab = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [importData, setImportData] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: '',
    team: ''
  });

  // Fetch users from API
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/system-users'],
    queryFn: () => fetch('/api/system-users').then(res => res.json())
  });

  // Calculate user statistics from actual data
  const userStats = {
    total: users.length,
    active: users.filter((user: any) => user.isActive !== false).length,
    online: users.filter((user: any) => user.isOnline).length,
    pending: users.filter((user: any) => user.status === 'pending').length
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => 
      apiRequest('POST', '/api/system-users', {
        username: userData.username,
        displayName: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        team: userData.team
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      setShowUserDialog(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: '',
        team: ''
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) => 
      apiRequest('PUT', `/api/system-users/${id}`, {
        username: userData.username,
        displayName: userData.name,
        email: userData.email,
        role: userData.role,
        team: userData.team,
        isActive: userData.isActive
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      setShowEditDialog(false);
      setEditingUser(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('DELETE', `/api/system-users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
    }
  });

  // Import users mutation
  const importUsersMutation = useMutation({
    mutationFn: (usersData: any[]) => 
      fetch('/api/system-users/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: usersData })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
      setShowImportDialog(false);
      setImportData('');
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = () => {
    if (!formData.name || !formData.email || !formData.username || !formData.password || !formData.role) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.displayName,
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      team: user.team || ''
    });
    setShowEditDialog(true);
  };

  const handleImportUsers = () => {
    try {
      // Parse dos dados da importação (formato JSON ou texto estruturado)
      const lines = importData.trim().split('\n').filter(line => line.trim());
      const usersToImport = [];

      for (const line of lines) {
        // Se for JSON
        if (line.trim().startsWith('{')) {
          try {
            const userData = JSON.parse(line);
            usersToImport.push(userData);
          } catch (e) {
            console.error('Erro ao parsear JSON:', e);
          }
        } else {
          // Se for formato CSV/TSV (nome;email;função;equipe)
          const parts = line.split(';').map(p => p.trim());
          if (parts.length >= 3) {
            const [name, email, role, team = ''] = parts;
            const username = email.split('@')[0]; // Gerar username do email
            const password = 'senha123'; // Senha padrão
            
            usersToImport.push({
              displayName: name,
              email,
              username,
              password,
              role: role.toLowerCase(),
              team,
              isActive: true
            });
          }
        }
      }

      if (usersToImport.length > 0) {
        importUsersMutation.mutate(usersToImport);
      } else {
        alert('Nenhum usuário válido encontrado nos dados de importação');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro ao processar dados de importação');
    }
  };

  const generateSampleData = () => {
    const sampleUsers = `Ana Silva;ana.silva@educhat.com;atendente;Atendimento
João Santos;joao.santos@educhat.com;gerente;Vendas
Maria Costa;maria.costa@educhat.com;atendente;Suporte
Pedro Oliveira;pedro.oliveira@educhat.com;supervisor;Tutoria
Carla Ferreira;carla.ferreira@educhat.com;atendente;Secretaria
Lucas Almeida;lucas.almeida@educhat.com;gerente;Financeiro
Camila Rodrigues;camila.rodrigues@educhat.com;atendente;Cobrança
Rafael Lima;rafael.lima@educhat.com;supervisor;Comercial
Juliana Martins;juliana.martins@educhat.com;atendente;Atendimento
Bruno Sousa;bruno.sousa@educhat.com;gerente;Operações`;
    setImportData(sampleUsers);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !formData.name || !formData.email || !formData.username || !formData.role) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    updateUserMutation.mutate({
      id: editingUser.id,
      userData: {
        ...formData,
        isActive: editingUser.isActive
      }
    });
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleToggleUserStatus = (user: any) => {
    updateUserMutation.mutate({
      id: user.id,
      userData: {
        name: user.displayName,
        email: user.email,
        username: user.username,
        role: user.role,
        team: user.team || '',
        isActive: !user.isActive
      }
    });
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const userStatus = user.isActive ? 'active' : 'inactive';
    const matchesStatus = selectedStatus === "all" || userStatus === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome, email ou função..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="agent">Atendente</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Agora</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.online}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{userStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Usuários
              </Button>
              <Button onClick={() => setShowUserDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeStyle(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {user.team || "Não atribuído"}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                        <span className="capitalize">{user.status}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <time className="text-sm text-muted-foreground">
                        {formatDistanceToNow(user.lastLoginAt)}
                      </time>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar usuário
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            Resetar senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                            <UserX className="h-4 w-4 mr-2" />
                            {user.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação de Usuário */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                placeholder="Nome completo"
                className="col-span-3"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                placeholder="email@exemplo.com"
                type="email"
                className="col-span-3"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuário
              </Label>
              <Input
                id="username"
                placeholder="nome_usuario"
                className="col-span-3"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="password"
                placeholder="Digite uma senha segura"
                type="password"
                className="col-span-3"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right">
                Equipe
              </Label>
              <Select value={formData.team} onValueChange={(value) => handleInputChange('team', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Equipe Comercial</SelectItem>
                  <SelectItem value="suporte">Equipe Suporte</SelectItem>
                  <SelectItem value="financeiro">Equipe Financeiro</SelectItem>
                  <SelectItem value="secretaria">Equipe Secretaria</SelectItem>
                  <SelectItem value="secretaria_pos">Equipe Secretaria Pós</SelectItem>
                  <SelectItem value="tutoria">Equipe Tutoria</SelectItem>
                  <SelectItem value="cobranca">Equipe Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite as informações do usuário. A senha é opcional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Usuário
              </Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="col-span-3"
                placeholder="Deixe em branco para manter atual"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Função
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-team" className="text-right">
                Equipe
              </Label>
              <Select value={formData.team} onValueChange={(value) => handleInputChange('team', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Equipe Comercial</SelectItem>
                  <SelectItem value="suporte">Equipe Suporte</SelectItem>
                  <SelectItem value="financeiro">Equipe Financeiro</SelectItem>
                  <SelectItem value="secretaria">Equipe Secretaria</SelectItem>
                  <SelectItem value="secretaria_pos">Equipe Secretaria Pós</SelectItem>
                  <SelectItem value="tutoria">Equipe Tutoria</SelectItem>
                  <SelectItem value="cobranca">Equipe Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Importação de Usuários */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar Usuários em Lote</DialogTitle>
            <DialogDescription>
              Importe múltiplos usuários de uma vez usando o formato: Nome;Email;Função;Equipe (um por linha)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Dados dos Usuários</Label>
              <Textarea
                id="import-data"
                placeholder="Ana Silva;ana.silva@educhat.com;atendente;Atendimento
João Santos;joao.santos@educhat.com;gerente;Vendas
Maria Costa;maria.costa@educhat.com;atendente;Suporte"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Formato aceito:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Nome Completo;email@dominio.com;função;equipe
              </p>
              <div className="text-xs space-y-1">
                <p><strong>Funções válidas:</strong> admin, gerente, atendente, supervisor</p>
                <p><strong>Equipes válidas:</strong> Atendimento, Vendas, Suporte, Tutoria, Secretaria, Financeiro, Cobrança, Comercial, Operações</p>
                <p><strong>Senha padrão:</strong> senha123 (usuários devem alterar no primeiro acesso)</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={generateSampleData}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Carregar Exemplo
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImportUsers}
              disabled={!importData.trim() || importUsersMutation.isPending}
            >
              {importUsersMutation.isPending ? 'Importando...' : 'Importar Usuários'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash className="h-5 w-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Tem certeza que deseja excluir o usuário <strong className="text-foreground">{userToDelete?.displayName || userToDelete?.name}</strong>?
              <br /><br />
              <div className="bg-muted p-3 rounded-md border-l-4 border-destructive">
                <div className="flex items-start gap-2">
                  <div className="text-destructive mt-0.5">⚠️</div>
                  <div className="text-sm">
                    <strong>Esta ação não pode ser desfeita.</strong><br />
                    Todos os dados relacionados a este usuário serão permanentemente removidos do sistema.
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
              }}
              className="flex-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
            >
              {deleteUserMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  Excluir Usuário
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};