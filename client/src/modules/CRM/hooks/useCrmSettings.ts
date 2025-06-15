import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemSetting } from '../types/settings';

export function useCrmSettings(open: boolean) {
  const queryClient = useQueryClient();

  // Buscar configurações do sistema
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings');
      if (!response.ok) throw new Error('Erro ao buscar configurações');
      return response.json();
    },
    enabled: open,
  });

  // Mutation para criar/atualizar configurações
  const updateSetting = useMutation({
    mutationFn: async ({ key, value, type, description, category }: {
      key: string;
      value: string;
      type: string;
      description: string;
      category: string;
    }) => {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type, description, category })
      });
      if (!response.ok) throw new Error('Erro ao salvar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
    },
  });

  return {
    settings,
    isLoading,
    updateSetting,
  };
} 