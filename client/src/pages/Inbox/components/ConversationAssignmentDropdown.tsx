import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Badge } from '@/shared/ui/ui/badge';
import { Users, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useTeams } from '@/shared/lib/hooks/useTeams';
import { useSystemUsers } from '@/shared/lib/hooks/useSystemUsers';

interface ConversationAssignmentDropdownProps {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  currentMacrosetor?: string | null;
}

export function ConversationAssignmentDropdown({
  conversationId,
  currentTeamId,
  currentUserId,
  currentMacrosetor
}: ConversationAssignmentDropdownProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar equipes e usuários usando hooks existentes
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useSystemUsers();

  // Mutação para atribuir à equipe
  const assignToTeamMutation = useMutation({
    mutationFn: ({ teamId }: { teamId: number }) =>
      apiRequest(`/api/conversations/${conversationId}/assign-team`, {
        method: 'POST',
        body: JSON.stringify({ teamId, method: 'manual' })
      }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Conversa atribuída à equipe com sucesso"
      });
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

  // Mutação para atribuir ao usuário
  const assignToUserMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) =>
      apiRequest(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        body: JSON.stringify({ userId, method: 'manual' })
      }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Conversa atribuída ao usuário com sucesso"
      });
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

  const handleTeamAssignment = async (teamId: string) => {
    if (teamId === 'none') {
      // Remover atribuição de equipe
      try {
        await apiRequest(`/api/conversations/${conversationId}/assign-team`, {
          method: 'POST',
          body: JSON.stringify({ teamId: null, method: 'manual' })
        });
        toast({
          title: "Sucesso",
          description: "Conversa movida para fila neutra"
        });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover atribuição",
          variant: "destructive"
        });
      }
    } else {
      assignToTeamMutation.mutate({ teamId: parseInt(teamId) });
    }
  };

  const handleUserAssignment = async (userId: string) => {
    if (userId === 'none') {
      // Remover atribuição de usuário
      try {
        await apiRequest(`/api/conversations/${conversationId}/assign-user`, {
          method: 'POST',
          body: JSON.stringify({ userId: null, method: 'manual' })
        });
        toast({
          title: "Sucesso",
          description: "Conversa não atribuída a usuário específico"
        });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover atribuição",
          variant: "destructive"
        });
      }
    } else {
      assignToUserMutation.mutate({ userId: parseInt(userId) });
    }
  };

  const currentTeam = teams.find(team => team.id === currentTeamId);
  const currentUser = users.find(user => user.id === currentUserId);

  return (
    <div className="flex items-center gap-2">
      {/* Seletor de Equipe */}
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500" />
        <Select
          value={currentTeamId ? currentTeamId.toString() : 'none'}
          onValueChange={handleTeamAssignment}
          disabled={assignToTeamMutation.isPending}
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
                    style={{ backgroundColor: team.color }}
                  />
                  {team.name}
                  {team.macrosetor && (
                    <span className="text-xs text-gray-500">
                      ({team.macrosetor})
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
          disabled={assignToUserMutation.isPending}
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

      {/* Indicador de macrosetor detectado automaticamente */}
      {currentMacrosetor && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
          {currentMacrosetor}
        </Badge>
      )}
    </div>
  );
}