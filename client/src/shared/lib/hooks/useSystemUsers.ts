import { useQuery } from '@tanstack/react-query';

export function useSystemUsers() {
  return useQuery({
    queryKey: ['/api/system-users'],
    queryFn: async () => {
      const response = await fetch('/api/system-users');
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários do sistema');
      }
      return response.json();
    },
    staleTime: 300000, // Cache válido por 5 minutos
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}