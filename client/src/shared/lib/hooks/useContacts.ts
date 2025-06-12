import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { 
  usePaginatedApiResource, 
  useApiResource, 
  useCreateResource, 
  useUpdateResource, 
  useDeleteResource,
  resourceConfigs 
} from './useApiResource';
import type { Contact, ContactWithTags, InsertContact } from '@shared/schema';

export function useContacts(params?: { search?: string; page?: number; limit?: number }) {
  return usePaginatedApiResource<Contact>({
    queryKey: ['/api/contacts'],
    endpoint: '/api/contacts',
    ...resourceConfigs.stable
  }, params, {
    select: (data) => {
      // Se a resposta é um array (formato antigo), converte para o novo formato
      if (Array.isArray(data)) {
        return {
          data: data,
          total: data.length
        };
      }
      return data;
    }
  });
}

export function useContact(id: number | null) {
  return useApiResource<ContactWithTags>({
    queryKey: ['/api/contacts', id],
    endpoint: `/api/contacts/${id}`,
    enabled: !!id,
    ...resourceConfigs.stable
  });
}

export function useCreateContact() {
  return useCreateResource<Contact, InsertContact>(
    '/api/contacts',
    [['/api/contacts']]
  );
}

export function useUpdateContact() {
  return useUpdateResource<Contact, { id: number; name: string; email: string; phone: string }>(
    ({ id }) => `/api/contacts/${id}`,
    ({ id }) => [['/api/contacts'], ['/api/contacts', id]]
  );
}

export function useDeleteContact() {
  return useDeleteResource<number>(
    (id) => `/api/contacts/${id}`,
    [['/api/contacts']]
  );
}

// Z-API specific hooks (mantidas para configurações avançadas)
export function useZApiContacts(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['/api/zapi/contacts', { page, pageSize }],
    queryFn: async () => {
      const response = await fetch(`/api/zapi/contacts?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error('Falha ao buscar contatos da Z-API');
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useValidatePhoneNumber() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', `/api/zapi/contacts/${encodeURIComponent(phone)}/validate`);
      return response.json();
    }
  });
}

export function useBlockContact() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', `/api/zapi/contacts/${encodeURIComponent(phone)}/block`);
      return response.json();
    }
  });
}

export function useImportZApiContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/zapi/import-contacts');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Importação concluída",
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Hook para sincronizar mensagens perdidas da Z-API
export function useSyncZApiMessages() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ since, phone }: { since?: string; phone?: string } = {}) => {
      const response = await apiRequest('POST', '/api/zapi/sync-messages', { since, phone });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: `${data.summary.processed} mensagens sincronizadas`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Hook to get contact metadata from Z-API
export function useZApiContactMetadata(phone: string | null) {
  return useQuery({
    queryKey: ['/api/zapi/contacts', phone],
    queryFn: async () => {
      if (!phone) throw new Error('Phone number is required');
      
      const response = await fetch(`/api/zapi/contacts/${phone}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contact metadata');
      }
      return response.json();
    },
    enabled: !!phone,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2
  });
}

// Hook to get updated profile picture from Z-API
export function useZApiProfilePicture(phone: string | null) {
  return useQuery({
    queryKey: ['/api/zapi/profile-picture', phone],
    queryFn: async () => {
      if (!phone) throw new Error('Phone number is required');
      
      const response = await fetch(`/api/zapi/profile-picture?phone=${encodeURIComponent(phone)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile picture');
      }
      return response.json();
    },
    enabled: !!phone,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes since pictures don't change often
    retry: 2
  });
}