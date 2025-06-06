import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Badge } from '@/shared/ui/ui/badge';
import { SimpleModal } from '@/components/SimpleModal';
import { Plus, Pencil, Trash2, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

export function UsersTabFixed() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeleteingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
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

  // Buscar usuários do banco de dados
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/system-users'],
  });

  // Buscar equipes para seleção
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const resetForm = () => {
    setFormData({
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

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleOpenEditModal = (user: User) => {
    setFormData({
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
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Editar usuário existente
        await apiRequest(`/api/system-users/${editingUser.id}`, {
          method: 'PUT',
          body: {
            ...formData,
            channels: formData.channels,
            macrosetores: formData.macrosetores
          }
        });
        toast({
          title: "Usuário atualizado",
          description: "O usuário foi atualizado com sucesso!"
        });
        handleCloseEditModal();
      } else {
        // Criar novo usuário
        await apiRequest('/api/system-users', {
          method: 'POST',
          body: {
            ...formData,
            channels: formData.channels,
            macrosetores: formData.macrosetores
          }
        });
        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso!"
        });
        handleCloseCreateModal();
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: editingUser ? "Erro ao atualizar usuário" : "Erro ao criar usuário"
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    
    try {
      await apiRequest(`/api/system-users/${deletingUser.id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso!"
      });
      
      setDeleteingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/system-users'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir usuário"
      });
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários que têm acesso ao sistema
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user: User) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{user.displayName}</h4>
                    <p className="text-sm text-muted-foreground">@{user.username} • {user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                      {user.team && (
                        <Badge variant="outline">
                          {user.team.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteingUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      <SimpleModal
        isOpen={isCreateModalOpen || editingUser !== null}
        onClose={editingUser ? handleCloseEditModal : handleCloseCreateModal}
        title={editingUser ? "Editar Usuário" : "Novo Usuário"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Ex: joao.silva"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="joao@exemplo.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="displayName">Nome completo</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="João Silva"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha {editingUser && "(deixe em branco para manter atual)"}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={editingUser ? "Nova senha (opcional)" : "Senha"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
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
            <div>
              <Label htmlFor="team">Equipe</Label>
              <Select 
                value={formData.teamId?.toString() || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value ? parseInt(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma equipe</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={editingUser ? handleCloseEditModal : handleCloseCreateModal}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? "Atualizar" : "Criar"} Usuário
            </Button>
          </div>
        </div>
      </SimpleModal>

      {/* Modal de Confirmação de Exclusão */}
      <SimpleModal
        isOpen={deletingUser !== null}
        onClose={() => setDeleteingUser(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir o usuário <strong>{deletingUser?.displayName}</strong>?</p>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteingUser(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}