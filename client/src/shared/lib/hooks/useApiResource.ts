
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface ApiResourceConfig<T = any> {
  queryKey: string[];
  endpoint: string;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResourceHookOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {}

/**
 * Hook base para gerenciamento de recursos da API
 * Centraliza lógicas comuns de cache, estado e operações CRUD
 */
export function useApiResource<T = any>(
  config: ApiResourceConfig<T>,
  options?: ApiResourceHookOptions<T>
) {
  return useQuery<T>({
    queryKey: config.queryKey,
    queryFn: async () => {
      const response = await fetch(config.endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${config.endpoint}`);
      }
      return response.json();
    },
    staleTime: config.staleTime || 1000 * 60 * 5, // 5 minutos padrão
    gcTime: config.gcTime || 1000 * 60 * 10, // 10 minutos padrão
    refetchInterval: config.refetchInterval,
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? true,
    enabled: config.enabled ?? true,
    ...options
  });
}

/**
 * Hook para recursos paginados
 */
export function usePaginatedApiResource<T = any>(
  config: ApiResourceConfig<PaginatedResponse<T>>,
  params?: { search?: string; page?: number; limit?: number },
  options?: ApiResourceHookOptions<PaginatedResponse<T>>
) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  
  const endpoint = `${config.endpoint}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  return useApiResource<PaginatedResponse<T>>({
    ...config,
    queryKey: [...config.queryKey, params],
    endpoint
  }, options);
}

/**
 * Hook para operações de criação
 */
export function useCreateResource<TData = any, TVariables = any>(
  endpoint: string,
  invalidateKeys: string[][],
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      // Invalidar todas as queries relacionadas
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      // Executar callback personalizado se fornecido
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
}

/**
 * Hook para operações de atualização
 */
export function useUpdateResource<TData = any, TVariables = any>(
  getEndpoint: (variables: TVariables) => string,
  invalidateKeys: (variables: TVariables) => string[][],
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const endpoint = getEndpoint(variables);
      const response = await apiRequest('PUT', endpoint, variables);
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      // Invalidar queries específicas baseadas nas variáveis
      const keys = invalidateKeys(variables);
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
}

/**
 * Hook para operações de exclusão
 */
export function useDeleteResource<TVariables = any>(
  getEndpoint: (variables: TVariables) => string,
  invalidateKeys: string[][],
  options?: UseMutationOptions<any, Error, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const endpoint = getEndpoint(variables);
      const response = await apiRequest('DELETE', endpoint);
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
}

/**
 * Configurações padrão para diferentes tipos de recursos
 */
export const resourceConfigs = {
  // Recursos que mudam frequentemente (mensagens, conversas)
  realtime: {
    staleTime: 0,
    gcTime: 1000 * 60, // 1 minuto
    refetchOnWindowFocus: true,
    refetchInterval: 10000 // 10 segundos
  },
  
  // Recursos relativamente estáveis (contatos, usuários)
  stable: {
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: true,
    refetchInterval: false
  },
  
  // Recursos raramente alterados (configurações, permissões)
  static: {
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
    refetchOnWindowFocus: false,
    refetchInterval: false
  }
};
