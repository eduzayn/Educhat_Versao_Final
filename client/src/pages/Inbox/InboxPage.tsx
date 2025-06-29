import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useToast } from '@/shared/lib/hooks/use-toast';

export function InboxPage() {
  const [userFilter, setUserFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const apiFilters = useMemo(() => {
    const filters: any = {};
    if (userFilter !== 'all') {
      if (userFilter === 'unassigned') filters.unassigned = true;
      else filters.userId = parseInt(userFilter);
    }
    if (teamFilter !== 'all' && userFilter === 'all') {
      if (teamFilter === 'unassigned') filters.unassigned = true;
      else filters.teamId = parseInt(teamFilter);
    }
    return filters;
  }, [userFilter, teamFilter]);

  const {
    data: conversationsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useConversations(50, apiFilters); // Corrigido: carregamento inicial aumentado para 50

  const conversations = conversationsData?.pages ? conversationsData.pages.flatMap(p => p || []) : [];

  const handleForceSync = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      await queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
      toast({ title: '✅ Conversas sincronizadas com sucesso.' });
    } catch (error) {
      toast({
        title: '❌ Erro ao sincronizar',
        description: (error as Error)?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  }, [queryClient, toast]);

  return (
    <div>
      <button onClick={handleForceSync} className="bg-blue-600 text-white rounded p-2 text-sm">
        Sincronizar Conversas
      </button>

      <div className="mt-4">
        {conversations.map((c) => (
          <div key={c.id} className="p-2 border-b border-gray-200">
            <p className="text-sm font-medium">{c.contact?.name || 'Sem nome'}</p>
            <p className="text-xs text-gray-500">{new Date(c.lastMessageAt).toLocaleString()}</p>
          </div>
        ))}

        {isFetchingNextPage && <p>Carregando mais...</p>}
      </div>

      {!hasNextPage && conversations.length > 0 && (
        <p className="text-center text-gray-400 mt-4">Todas as conversas foram carregadas</p>
      )}
    </div>
  );
}