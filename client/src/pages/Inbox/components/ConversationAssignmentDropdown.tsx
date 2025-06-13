import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Users, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Team, SystemUser } from '@shared/schema';

interface ConversationAssignmentDropdownProps {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  detectedTeam?: string | null;
}

export function ConversationAssignmentDropdown({
  conversationId,
  currentTeamId,
  currentUserId,
  detectedTeam
}: ConversationAssignmentDropdownProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [teamUsers, setTeamUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);


  // Carregar dados iniciais com cache
  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar cache para teams
        const teamsCacheKey = 'assignment-teams';
        const usersCacheKey = 'assignment-users';
        const cachedTeams = sessionStorage.getItem(teamsCacheKey);
        const cachedUsers = sessionStorage.getItem(usersCacheKey);
        
        let teamsData = [];
        let usersData = [];
        let needsFetch = false;

        // Verificar cache de teams
        if (cachedTeams) {
          try {
            const teamsCache = JSON.parse(cachedTeams);
            if (Date.now() - teamsCache.timestamp < 300000) { // 5 minutos
              teamsData = teamsCache.data;
            } else {
              needsFetch = true;
            }
          } catch (e) {
            needsFetch = true;
          }
        } else {
          needsFetch = true;
        }

        // Verificar cache de users
        if (cachedUsers && !needsFetch) {
          try {
            const usersCache = JSON.parse(cachedUsers);
            if (Date.now() - usersCache.timestamp < 300000) { // 5 minutos
              usersData = usersCache.data;
            } else {
              needsFetch = true;
            }
          } catch (e) {
            needsFetch = true;
          }
        } else {
          needsFetch = true;
        }

        if (needsFetch) {
          const [teamsResponse, usersResponse] = await Promise.all([
            fetch('/api/teams'),
            fetch('/api/system-users')
          ]);

          if (teamsResponse.ok && usersResponse.ok) {
            teamsData = await teamsResponse.json();
            usersData = await usersResponse.json();
            
            // Salvar no cache
            sessionStorage.setItem(teamsCacheKey, JSON.stringify({
              data: teamsData,
              timestamp: Date.now()
            }));
            sessionStorage.setItem(usersCacheKey, JSON.stringify({
              data: usersData,
              timestamp: Date.now()
            }));
          }
        }

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Carregar usuários da equipe quando currentTeamId mudar
  useEffect(() => {
    const loadTeamUsers = async () => {
      if (!currentTeamId) {
        setTeamUsers([]);
        return;
      }

      // Cache simples para evitar recarregamentos desnecessários
      const cacheKey = `team-users-${currentTeamId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          if (Date.now() - cachedData.timestamp < 300000) { // 5 minutos
            setTeamUsers(cachedData.data);
            return;
          }
        } catch (e) {
          // Cache inválido, continuar com fetch
        }
      }

      try {
        const response = await fetch(`/api/teams/${currentTeamId}/users`);
        if (response.ok) {
          const teamUsersData = await response.json();
          const data = Array.isArray(teamUsersData) ? teamUsersData : [];
          setTeamUsers(data);
          
          // Salvar no cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar usuários da equipe:', error);
        setTeamUsers([]);
      }
    };

    loadTeamUsers();
  }, [currentTeamId]);

  const handleTeamAssignment = async (teamId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: teamId === 'none' ? null : parseInt(teamId), 
          method: 'manual' 
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: teamId === 'none' ? "Conversa movida para fila neutra" : "Conversa atribuída à equipe com sucesso"
        });
        // Refresh da página para atualizar os dados
        window.location.reload();
      } else {
        throw new Error('Erro na atribuição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir à equipe",
        variant: "destructive"
      });
    }
  };

  const handleUserAssignment = async (userId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId === 'none' ? null : parseInt(userId), 
          method: 'manual' 
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: userId === 'none' ? "Conversa não atribuída a usuário específico" : "Conversa atribuída ao usuário com sucesso"
        });
        // Refresh da página para atualizar os dados
        window.location.reload();
      } else {
        throw new Error('Erro na atribuição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir ao usuário",
        variant: "destructive"
      });
    }
  };



  const currentTeam = teams.find(team => team.id === currentTeamId);
  const currentUser = users.find(user => user.id === currentUserId);

  if (loading) {
    return <div className="text-xs text-gray-500">Carregando...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Seletor de Equipe */}
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500" />
        <Select
          value={currentTeamId ? currentTeamId.toString() : 'none'}
          onValueChange={handleTeamAssignment}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="h-7 min-w-[120px] text-xs border-gray-300">
                  <SelectValue>
                    {currentTeam ? (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5"
                        style={{ backgroundColor: currentTeam.color ? currentTeam.color + '20' : '#f3f4f6', color: currentTeam.color || '#6b7280' }}
                      >
                        {currentTeam.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-500">Sem grupo</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
              </TooltipTrigger>
              {currentTeam && (
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium mb-1">Membros da equipe:</div>
                    {teamUsers.length > 0 ? (
                      <div className="space-y-1">
                        {teamUsers.filter(user => user.isActive).map(user => (
                          <div key={user.id} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span>{user.displayName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Nenhum membro ativo</span>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Sem grupo (Fila neutra)</span>
            </SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id.toString()}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: team.color || '#6b7280' }}
                  />
                  {team.name}
                  {team.teamType && (
                    <span className="text-xs text-gray-500">
                      ({team.teamType})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seletor de Usuário */}
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-gray-500" />
        <Select
          value={currentUserId ? currentUserId.toString() : 'none'}
          onValueChange={handleUserAssignment}
        >
          <SelectTrigger className="h-7 min-w-[120px] text-xs border-gray-300">
            <SelectValue>
              {currentUser ? (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {currentUser.displayName}
                </Badge>
              ) : (
                <span className="text-gray-500">Não atribuído</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Não atribuído</span>
            </SelectItem>
            {(currentTeamId ? teamUsers : users).filter(user => user.isActive).map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {user.displayName}
                  <span className="text-xs text-gray-500">
                    ({user.username})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>



      {/* Indicador de equipe detectada automaticamente */}
      {detectedTeam && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
          {detectedTeam}
        </Badge>
      )}
    </div>
  );
}