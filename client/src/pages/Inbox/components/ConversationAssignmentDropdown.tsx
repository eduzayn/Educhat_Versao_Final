import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Users, User } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Team, SystemUser } from '@/shared/schema';

interface ConversationAssignmentDropdownProps {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  currentTeamType?: string | null;
}

export function ConversationAssignmentDropdown({
  conversationId,
  currentTeamId,
  currentUserId,
  currentTeamType
}: ConversationAssignmentDropdownProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsResponse, usersResponse] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/system-users')
        ]);

        if (teamsResponse.ok && usersResponse.ok) {
          const teamsData = await teamsResponse.json();
          const usersData = await usersResponse.json();
          setTeams(teamsData);
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const assignTeamMutation = useMutation({
    mutationFn: (teamId: string) => 
      apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        assignedTeamId: teamId === 'none' ? null : parseInt(teamId),
        method: 'manual'
      }),
    onSuccess: (_, teamId) => {
      toast({
        title: "Sucesso",
        description: teamId === 'none' ? "Conversa movida para fila neutra" : "Conversa atribuída à equipe com sucesso"
      });
      // Invalidar e recarregar cache das conversas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir à equipe",
        variant: "destructive"
      });
    }
  });

  const handleTeamAssignment = (teamId: string) => {
    assignTeamMutation.mutate(teamId);
  };

  const assignUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        assignedUserId: userId === 'none' ? null : parseInt(userId),
        method: 'manual'
      }),
    onSuccess: (_, userId) => {
      toast({
        title: "Sucesso",
        description: userId === 'none' ? "Conversa não atribuída a usuário específico" : "Conversa atribuída ao usuário com sucesso"
      });
      // Invalidar e recarregar cache das conversas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir ao usuário",
        variant: "destructive"
      });
    }
  });

  const handleUserAssignment = (userId: string) => {
    assignUserMutation.mutate(userId);
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
          disabled={assignTeamMutation.isPending}
        >
          <SelectTrigger className="h-7 min-w-[120px] text-xs border-gray-300">
            <SelectValue>
              {currentTeam ? (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5"
                  style={{ backgroundColor: currentTeam.color + '20', color: currentTeam.color }}
                >
                  {currentTeam.name}
                </Badge>
              ) : (
                <span className="text-gray-500">Sem grupo</span>
              )}
            </SelectValue>
          </SelectTrigger>
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
          disabled={assignUserMutation.isPending}
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
            {users.filter(user => user.isActive).map(user => (
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

      {/* Indicador de categoria detectada automaticamente */}
      {currentTeamType && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
          {currentTeamType}
        </Badge>
      )}
    </div>
  );
}