import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Building2, Plus, Users, Settings, Loader2, UserPlus, MoreHorizontal } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

interface Team {
  id: number;
  name: string;
  description: string | null;
  teamType: string | null;
  color: string | null;
  isActive: boolean | null;
  memberCount?: number;
  conversationCount?: number;
}

interface TeamFormData {
  name: string;
  description: string;
  teamType: string;
  color: string;
  isActive: boolean;
}

const teamColors = [
  { value: '#4F46E5', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#EF4444', label: 'Vermelho' }
];

const teamTypes = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'academico', label: 'Acadêmico' }
];

export default function TeamsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState<TeamFormData>({
    name: '',
    description: '',
    teamType: '',
    color: '#4F46E5',
    isActive: true
  });

  // Query para buscar equipes
  const { data: teams, isLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await apiRequest('/api/teams');
      return response as Team[];
    }
  });

  // Mutation para criar nova equipe
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      return await apiRequest('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setShowCreateDialog(false);
      setNewTeamForm({
        name: '',
        description: '',
        teamType: '',
        color: '#4F46E5',
        isActive: true
      });
      toast({
        title: "Equipe criada!",
        description: "A nova equipe foi criada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar equipe",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a equipe.",
        variant: "destructive"
      });
      return;
    }

    if (!newTeamForm.teamType) {
      toast({
        title: "Tipo obrigatório",
        description: "Por favor, selecione o tipo da equipe.",
        variant: "destructive"
      });
      return;
    }

    createTeamMutation.mutate(newTeamForm);
  };

  const getTeamColorClass = (color: string | null) => {
    if (!color) return 'bg-gray-100 text-gray-800';
    
    const colorMap: Record<string, string> = {
      '#4F46E5': 'bg-indigo-100 text-indigo-800',
      '#10B981': 'bg-emerald-100 text-emerald-800',
      '#F59E0B': 'bg-amber-100 text-amber-800',
      '#8B5CF6': 'bg-violet-100 text-violet-800',
      '#EC4899': 'bg-pink-100 text-pink-800',
      '#06B6D4': 'bg-cyan-100 text-cyan-800',
      '#EF4444': 'bg-red-100 text-red-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestão de Equipes
              </h1>
              <p className="text-gray-600">
                Gerencie equipes, membros e configurações do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/teams/transfer">
                <Button variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  Transferir Conversas
                </Button>
              </Link>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Equipe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Equipe</DialogTitle>
                    <DialogDescription>
                      Preencha as informações para criar uma nova equipe
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name">Nome da Equipe *</Label>
                      <Input
                        id="team-name"
                        value={newTeamForm.name}
                        onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Suporte Técnico"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="team-description">Descrição</Label>
                      <Textarea
                        id="team-description"
                        value={newTeamForm.description}
                        onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o propósito da equipe"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo da Equipe *</Label>
                      <Select value={newTeamForm.teamType} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, teamType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Cor da Equipe</Label>
                      <Select value={newTeamForm.color} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, color: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teamColors.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                      {createTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Criar Equipe
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Lista de Equipes */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando equipes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams?.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Gerenciar Membros
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {team.description && (
                      <CardDescription>{team.description}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tipo:</span>
                        <Badge variant="secondary" className={getTeamColorClass(team.color)}>
                          {team.teamType || 'Não definido'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={team.isActive ? "default" : "secondary"}>
                          {team.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Membros:</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{team.memberCount || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conversas:</span>
                        <span className="text-sm">{team.conversationCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {teams?.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma equipe encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece criando sua primeira equipe para organizar seus agentes.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira equipe
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}