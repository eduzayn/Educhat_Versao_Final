import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Building2, Plus, Users, Settings, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Team } from '@shared/schema';
import { formatDateAndTime } from '@/shared/lib/utils/formatters';

// Função para obter a cor baseada na cor hex da equipe
const getTeamColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    '#4F46E5': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    '#10B981': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    '#F59E0B': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    '#8B5CF6': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    '#EC4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    '#06B6D4': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    '#EF4444': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

export const TeamsTab = () => {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Estados do formulário de nova equipe
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    description: '',
    category: '',
    color: '',
    isActive: true
  });

  // Estados dos formulários dos modais
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true
  });

  // Estado para controlar membros da equipe
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar equipes do banco de dados
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: () => apiRequest('GET', '/api/teams')
  });

  // Buscar usuários disponíveis
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['/api/system-users'],
    queryFn: () => apiRequest('GET', '/api/system-users')
  });

  // Mutação para criar nova equipe
  const createTeamMutation = useMutation({
    mutationFn: (teamData: any) => apiRequest('POST', '/api/teams', teamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Equipe criada!",
        description: "A nova equipe foi criada com sucesso.",
      });
      setShowTeamDialog(false);
      setNewTeamForm({ name: '', description: '', category: '', color: '', isActive: true });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a equipe.",
        variant: "destructive",
      });
    }
  });

  // Mutação para adicionar membro à equipe
  const addMemberMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: number; teamId: number }) => 
      apiRequest('POST', '/api/user-teams', { userId, teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Membro adicionado!",
        description: "O usuário foi adicionado à equipe com sucesso.",
      });
      setShowAddMemberDialog(false);
      setSelectedUserId('');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o membro à equipe.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar configurações da equipe
  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, teamData }: { teamId: number; teamData: any }) => 
      apiRequest('PATCH', `/api/teams/${teamId}`, teamData),
    onSuccess: () => {
      // Força invalidação completa do cache de equipes
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.refetchQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Equipe atualizada!",
        description: "As configurações da equipe foram salvas com sucesso.",
      });
      setShowConfigDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a equipe.",
        variant: "destructive",
      });
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamForm.name || !newTeamForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e macrosetor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({
      name: newTeamForm.name,
      description: newTeamForm.description || null,
      category: newTeamForm.category,
      color: newTeamForm.color || '#4F46E5',
      isActive: newTeamForm.isActive
    });
  };

  const handleAddMember = () => {
    if (!selectedUserId || !selectedTeam) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione um usuário para adicionar.",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      userId: parseInt(selectedUserId),
      teamId: selectedTeam.id
    });
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam || !editTeamForm.name || !editTeamForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e macrosetor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    updateTeamMutation.mutate({
      teamId: selectedTeam.id,
      teamData: {
        name: editTeamForm.name,
        description: editTeamForm.description || null,
        category: editTeamForm.category,
        isActive: editTeamForm.isActive
      }
    });
  };

  // Atualizar formulário quando uma equipe for selecionada para configuração
  const handleOpenConfigDialog = (team: Team) => {
    setSelectedTeam(team);
    setEditTeamForm({
      name: team.name,
      description: team.description || '',
      category: team.teamType || '',
      isActive: team.isActive || true
    });
    setShowConfigDialog(true);
  };

  // Função para buscar membros da equipe
  const loadTeamMembers = async (teamId: number) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const members = await response.json();
        // Garantir ordenação alfabética no frontend também
        const sortedMembers = members.sort((a: any, b: any) => {
          const nameA = (a.user?.displayName || a.user?.username || '').toLowerCase();
          const nameB = (b.user?.displayName || b.user?.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setTeamMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da equipe.",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  // Função para mostrar membros da equipe
  const handleShowMembers = (team: any) => {
    setSelectedTeam(team);
    setShowMembersDialog(true);
    loadTeamMembers(team.id);
  };

  // Função para remover membro da equipe
  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Membro removido!",
          description: "O membro foi removido da equipe com sucesso.",
        });
        // Recarregar lista de membros
        loadTeamMembers(selectedTeam.id);
      } else {
        throw new Error('Erro ao remover membro');
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro da equipe.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Equipes de Trabalho</h3>
          <p className="text-sm text-muted-foreground">
            Organize usuários em equipes para melhor colaboração e gestão
          </p>
        </div>
        <Button 
          onClick={() => setShowTeamDialog(true)}
          className="z-10 relative"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando equipes...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Erro ao carregar equipes. Tente novamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((team: Team) => (
            <Card key={`team-${team.id}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={getTeamColorClass(team.color || '')}>
                    <Users className="h-3 w-3 mr-1" />
                    0
                  </Badge>
                </div>
                <CardDescription>{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Categoria:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {team.teamType || 'Não definido'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={team.isActive ? "default" : "destructive"} className="text-xs">
                      {team.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleShowMembers(team)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Ver Membros
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenConfigDialog(team)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Config
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação de Equipe */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar uma nova equipe educacional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-name" className="text-right">
                Nome *
              </Label>
              <Input
                id="team-name"
                placeholder="Nome da equipe"
                className="col-span-3"
                value={newTeamForm.name}
                onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="team-description"
                placeholder="Descrição da equipe"
                className="col-span-3"
                rows={3}
                value={newTeamForm.description}
                onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-macrosetor" className="text-right">
                Macrosetor *
              </Label>
              <Select value={newTeamForm.category} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o macrosetor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="secretaria_pos">Secretaria Pós</SelectItem>
                  <SelectItem value="tutoria">Tutoria</SelectItem>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-color" className="text-right">
                Cor
              </Label>
              <Select value={newTeamForm.color} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, color: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#3B82F6">Azul</SelectItem>
                  <SelectItem value="#10B981">Verde</SelectItem>
                  <SelectItem value="#8B5CF6">Roxo</SelectItem>
                  <SelectItem value="#F59E0B">Laranja</SelectItem>
                  <SelectItem value="#EF4444">Vermelho</SelectItem>
                  <SelectItem value="#6B7280">Cinza</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTeam}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Membro */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
            <DialogDescription>
              Adicione um usuário à equipe {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-select" className="text-right">
                Usuário
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {systemUsers.map((user: any) => (
                    <SelectItem key={`add-user-${user.id}`} value={user.id.toString()}>
                      {user.displayName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações da Equipe */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configurações da Equipe</DialogTitle>
            <DialogDescription>
              Configure as propriedades da equipe {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-name" className="text-right">
                Nome *
              </Label>
              <Input
                id="config-name"
                value={editTeamForm.name}
                onChange={(e) => setEditTeamForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="config-description"
                value={editTeamForm.description}
                onChange={(e) => setEditTeamForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-macrosetor" className="text-right">
                Macrosetor *
              </Label>
              <Select value={editTeamForm.category} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o macrosetor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="secretaria_pos">Secretaria Pós</SelectItem>
                  <SelectItem value="tutoria">Tutoria</SelectItem>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-status" className="text-right">
                Status
              </Label>
              <Select value={editTeamForm.isActive ? "true" : "false"} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, isActive: value === "true" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativa</SelectItem>
                  <SelectItem value="false">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateTeam}
              disabled={updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar e gerenciar membros da equipe */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Membros da Equipe: {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie os membros desta equipe. Você pode remover membros existentes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando membros...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum membro encontrado nesta equipe.</p>
                <p className="text-sm">Use o botão "Adicionar" para incluir membros.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div key={member.user?.id ? `member-${member.user.id}` : `member-index-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.user?.displayName?.[0]?.toUpperCase() || member.user?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.user?.displayName || member.user?.username || 'Nome não disponível'}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email || 'Email não disponível'}</p>
                        {member.role && (
                          <p className="text-xs text-blue-600 font-medium">{member.role}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user?.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddMemberDialog(true);
                setShowMembersDialog(false);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
            <Button onClick={() => setShowMembersDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};