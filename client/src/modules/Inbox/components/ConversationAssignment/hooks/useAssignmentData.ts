import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Team } from '@shared/schema';
import type { SystemUser } from '@shared/schema';

// Hook para carregar times
export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar times');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para carregar usuários do sistema
export function useSystemUsers() {
  return useQuery<SystemUser[]>({
    queryKey: ['/api/users/basic'],
    queryFn: async () => {
      const response = await fetch('/api/system-users', {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para carregar membros de uma equipe específica
export function useTeamUsers(teamId?: number | null) {
  return useQuery<SystemUser[]>({
    queryKey: ['/api/teams', teamId, 'users'],
    queryFn: async () => {
      if (!teamId) return [];
      const response = await fetch(`/api/teams/${teamId}/users`);
      if (!response.ok) throw new Error('Erro ao carregar membros da equipe');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}