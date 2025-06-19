import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/ui/alert-dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/shared/ui/tooltip';
import { Building2, Plus, Users, Settings, UserPlus, Loader2, X, AlertTriangle, UserMinus, Trash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Team } from '@shared/schema';

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
  const [showConfirmAddMember, setShowConfirmAddMember] = useState(false);
  const [showConfirmDeleteTeam, setShowConfirmDeleteTeam] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{user: any, team: Team} | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  
  // Estados do formulário de nova equipe
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    description: '',
    teamType: '',
    color: '',
    isActive: true
  });

  // Estados dos formulários dos modais
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    description: '',
    teamType: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar equipes do banco de dados
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Erro ao carregar equipes');
      }
      return response.json() as Promise<Team[]>;
    }
  });

  // Buscar usuários disponíveis
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      return response.json();
    }
  });

  // Buscar membros de cada equipe
  const { data: teamMembers = {} } = useQuery({
    queryKey: ['/api/team-members'],
    queryFn: async () => {
      if (!teams || teams.length === 0) return {};
      
      const membersData: Record<number, any[]> = {};
      
      await Promise.all(
        teams.map(async (team) => {
          try {
            const response = await fetch(`/api/user-teams/${team.id}`);
            if (response.ok) {
              membersData[team.id] = await response.json();
            } else {
              membersData[team.id] = [];
            }
          } catch (error) {
            membersData[team.id] = [];
          }
        })
      );
      
      return membersData;
    },
    enabled: !!teams && teams.length > 0
  });

  // Ensure systemUsers is always an array
  const systemUsersList = Array.isArray(systemUsers) ? systemUsers : [];

  // Mutação para criar nova equipe
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      if (!response.ok) {
        throw new Error('Erro ao criar equipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Equipe criada!",
        description: "A nova equipe foi criada com sucesso.",
      });
      setShowTeamDialog(false);
      setNewTeamForm({ name: '', description: '', teamType: '', color: '', isActive: true });
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
    mutationFn: async ({ userId, teamId }: { userId: number; teamId: number }) => {
      const response = await fetch('/api/user-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamId })
      });
      if (!response.ok) {
        throw new Error('Erro ao adicionar membro');
      }
      return response.json();
    },
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
    mutationFn: async ({ teamId, teamData }: { teamId: number; teamData: any }) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar equipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
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

  // Mutação para remover membro da equipe
  const removeMemberMutation = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: number; teamId: number }) => {
      const response = await fetch('/api/user-teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamId })
      });
      if (!response.ok) {
        throw new Error('Erro ao remover membro');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Membro removido!",
        description: "O usuário foi removido da equipe com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro da equipe.",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir equipe
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Erro ao excluir equipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      setShowConfirmDeleteTeam(false);
      setTeamToDelete(null);
      toast({
        title: "Equipe excluída!",
        description: "A equipe foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a equipe.",
        variant: "destructive",
      });
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamForm.name || !newTeamForm.teamType) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e tipo de equipe são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({
      name: newTeamForm.name,
      description: newTeamForm.description || null,
      teamType: newTeamForm.teamType,
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

    setShowConfirmAddMember(true);
  };

  const confirmAddMember = () => {
    if (selectedUserId && selectedTeam) {
      addMemberMutation.mutate({
        userId: parseInt(selectedUserId),
        teamId: selectedTeam.id
      });
      setShowConfirmAddMember(false);
    }
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam || !editTeamForm.name || !editTeamForm.teamType) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e tipo de equipe são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    updateTeamMutation.mutate({
      teamId: selectedTeam.id,
      teamData: {
        name: editTeamForm.name,
        description: editTeamForm.description || null,
        teamType: editTeamForm.teamType,
        isActive: editTeamForm.isActive
      }
    });
  };

  // Alternar expansão dos membros da equipe
  const toggleTeamExpansion = (teamId: number) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Atualizar formulário quando uma equipe for selecionada para configuração
  const handleOpenConfigDialog = (team: Team) => {
    setSelectedTeam(team);
    setEditTeamForm({
      name: team.name,
      description: team.description || '',
      teamType: team.teamType || '',
      isActive: team.isActive || true
    });
    setShowConfigDialog(true);
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
          {teams.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Badge variant="outline" className={getTeamColorClass(team.color || '')}>
                          <Users className="h-3 w-3 mr-1" />
                          {teamMembers[team.id]?.length || 0}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium mb-1">Membros da equipe:</div>
                        {teamMembers[team.id] && teamMembers[team.id].length > 0 ? (
                          <div className="space-y-1">
                            {teamMembers[team.id].map(member => (
                              <div key={member.id} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span>{member.displayName}</span>
                                <span className="text-xs text-gray-500">({member.role})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Nenhum membro na equipe</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Membros da Equipe */}
                  <div>
                    <span className="text-sm font-medium mb-2 block">Membros da Equipe:</span>
                    {teamMembers[team.id] && teamMembers[team.id].length > 0 ? (
                      <div className="space-y-2">
                        {(expandedTeams.has(team.id) ? teamMembers[team.id] : teamMembers[team.id].slice(0, 3)).map((member, index) => (
                          <div key={`team-${team.id}-member-${member.id}-${index}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {member.displayName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.displayName}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setMemberToRemove({ user: member, team });
                                  setShowRemoveMemberDialog(true);
                                }}
                                disabled={removeMemberMutation.isPending}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {teamMembers[team.id].length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                            onClick={() => toggleTeamExpansion(team.id)}
                          >
                            {expandedTeams.has(team.id) 
                              ? 'Mostrar menos'
                              : `+${teamMembers[team.id].length - 3} outros membros`
                            }
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-muted-foreground bg-muted/30 rounded-md">
                        <Users className="h-4 w-4 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Nenhum membro na equipe</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tipo de Equipe:</span>
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
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membro
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenConfigDialog(team)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setTeamToDelete(team);
                            setShowConfirmDeleteTeam(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir equipe</p>
                      </TooltipContent>
                    </Tooltip>
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
              <Label htmlFor="team-teamType" className="text-right">
                Tipo de Equipe *
              </Label>
              <Select value={newTeamForm.teamType} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, teamType: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de equipe" />
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
                  {systemUsersList.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
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
              <Label htmlFor="config-teamType" className="text-right">
                Tipo de Equipe *
              </Label>
              <Select value={editTeamForm.teamType} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, teamType: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de equipe" />
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

      {/* Diálogo de confirmação para adicionar membro */}
      <AlertDialog open={showConfirmAddMember} onOpenChange={setShowConfirmAddMember}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Adição de Membro</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserId && selectedTeam && (
                <>
                  Tem certeza que deseja adicionar{' '}
                  <strong>
                    {systemUsersList.find(user => user.id.toString() === selectedUserId)?.displayName || 
                     systemUsersList.find(user => user.id.toString() === selectedUserId)?.username || 'usuário selecionado'}
                  </strong>{' '}
                  à equipe <strong>{selectedTeam.name}</strong>?
                  <br /><br />
                  Esta ação dará ao usuário acesso às conversas e recursos desta equipe.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAddMember}
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Membro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação para Remover Membro */}
      <AlertDialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <UserMinus className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  Remover Membro da Equipe
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4">
            {memberToRemove && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted">
                      {memberToRemove.user.displayName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{memberToRemove.user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{memberToRemove.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    Será removido da equipe <strong>{memberToRemove.team.name}</strong>.
                    O usuário não receberá mais atribuições desta equipe.
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setShowRemoveMemberDialog(false);
                setMemberToRemove(null);
              }}
              className="flex-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  removeMemberMutation.mutate({ 
                    userId: memberToRemove.user.id, 
                    teamId: memberToRemove.team.id 
                  });
                  setShowRemoveMemberDialog(false);
                  setMemberToRemove(null);
                }
              }}
              disabled={removeMemberMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
            >
              {removeMemberMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4" />
                  Remover da Equipe
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação para Excluir Equipe */}
      <AlertDialog open={showConfirmDeleteTeam} onOpenChange={setShowConfirmDeleteTeam}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  Excluir Equipe
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  Esta ação não pode ser desfeita e é irreversível.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4">
            {teamToDelete && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{teamToDelete.name}</p>
                    <p className="text-xs text-muted-foreground">{teamToDelete.description || 'Sem descrição'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Todos os membros</strong> serão removidos desta equipe.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Conversas atribuídas</strong> à equipe ficarão sem atribuição.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Configurações e permissões</strong> da equipe serão perdidas.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setShowConfirmDeleteTeam(false);
                setTeamToDelete(null);
              }}
              className="flex-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (teamToDelete) {
                  deleteTeamMutation.mutate(teamToDelete.id);
                }
              }}
              disabled={deleteTeamMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1"
            >
              {deleteTeamMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  Excluir Equipe
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};