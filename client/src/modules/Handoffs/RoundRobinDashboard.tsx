import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Users, Clock, BarChart3, Settings, Target } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface RoundRobinUser {
  userId: number;
  displayName: string;
  isOnline: boolean;
  isActive: boolean;
  position: number;
  totalAssignments: number;
  activeConversations: number;
  distributionScore: number;
  lastAssignedAt: Date | null;
  isNext: boolean;
}

interface RoundRobinTeam {
  teamId: number;
  teamName: string;
  teamType: string;
  users: RoundRobinUser[];
  nextUserId: number | null;
  nextUserName: string | null;
}

interface RoundRobinDashboardProps {
  onRefresh?: () => void;
}

export function RoundRobinDashboard({ onRefresh }: RoundRobinDashboardProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<RoundRobinTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamType, setSelectedTeamType] = useState<string>('all');
  const [resetting, setResetting] = useState<number | null>(null);

  const teamTypes = [
    { value: 'all', label: 'Todas as Equipes' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'suporte', label: 'Suporte' },
    { value: 'cobranca', label: 'Cobrança' },
    { value: 'secretaria', label: 'Secretaria' },
    { value: 'tutoria', label: 'Tutoria' },
    { value: 'financeiro', label: 'Financeiro' }
  ];

  const loadRoundRobinStatus = async () => {
    try {
      setLoading(true);
      const params = selectedTeamType !== 'all' ? `?teamType=${selectedTeamType}` : '';
      const response = await fetch(`/api/handoffs/round-robin/status${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data.roundRobinStatus || []);
      } else {
        throw new Error('Erro ao carregar status do rodízio');
      }
    } catch (error) {
      console.error('Erro ao carregar rodízio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o status do rodízio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetTeam = async (teamId: number, teamName: string) => {
    try {
      setResetting(teamId);
      
      const response = await fetch('/api/handoffs/round-robin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Rodízio da equipe ${teamName} foi resetado`
        });
        await loadRoundRobinStatus();
        onRefresh?.();
      } else {
        throw new Error('Erro ao resetar rodízio');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resetar o rodízio",
        variant: "destructive"
      });
    } finally {
      setResetting(null);
    }
  };

  const getStatusColor = (user: RoundRobinUser) => {
    if (!user.isActive) return 'bg-gray-500';
    if (user.isNext) return 'bg-green-500';
    if (user.isOnline) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getStatusText = (user: RoundRobinUser) => {
    if (!user.isActive) return 'Inativo';
    if (user.isNext) return 'Próximo';
    if (user.isOnline) return 'Online';
    return 'Offline';
  };

  const formatLastAssigned = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''} atrás`;
    }
    return `${minutes}m atrás`;
  };

  useEffect(() => {
    loadRoundRobinStatus();
  }, [selectedTeamType]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rodízio Equitativo</h2>
          <p className="text-gray-600">Distribuição automática de atendimentos por equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTeamType} onValueChange={setSelectedTeamType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por equipe" />
            </SelectTrigger>
            <SelectContent>
              {teamTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadRoundRobinStatus}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards das equipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <Card key={team.teamId} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{team.teamName}</CardTitle>
                  <CardDescription className="capitalize">
                    {team.teamType}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetTeam(team.teamId, team.teamName)}
                  disabled={resetting === team.teamId}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {resetting === team.teamId ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Próximo na fila */}
              {team.nextUserName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Próximo:</span>
                  </div>
                  <p className="text-green-700 font-semibold mt-1">
                    {team.nextUserName}
                  </p>
                </div>
              )}

              {/* Lista de usuários */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Users className="h-4 w-4" />
                  <span>Fila de Rodízio ({team.users.length} atendentes)</span>
                </div>
                
                {team.users.map(user => (
                  <div 
                    key={user.userId}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      user.isNext ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          #{user.position}
                        </span>
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full",
                            getStatusColor(user)
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.activeConversations} ativa(s) • {user.totalAssignments} total
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          user.isNext && "border-green-500 text-green-700"
                        )}
                      >
                        {getStatusText(user)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatLastAssigned(user.lastAssignedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estatísticas da equipe */}
              <div className="border-t pt-3 mt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-lg font-semibold text-green-600">
                      {team.users.filter(u => u.isActive && u.isOnline).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {team.users.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma equipe encontrada
          </h3>
          <p className="text-gray-600">
            {selectedTeamType !== 'all' 
              ? 'Não há equipes ativas para o filtro selecionado.'
              : 'Não há equipes ativas no momento.'
            }
          </p>
        </div>
      )}
    </div>
  );
}