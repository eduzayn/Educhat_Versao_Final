import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Contact, ContactWithTags, InsertContact } from '@shared/schema';

export function useContacts(search?: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['/api/contacts', { search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const url = `/api/contacts?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      
      // Retornar objeto com dados de paginação
      return {
        data: Array.isArray(data.data) ? data.data : [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || limit,
        totalPages: data.totalPages || 1
      };
    },
    // Valor padrão para evitar erro
    initialData: {
      data: [],
      total: 0,
      page: 1,
      limit: limit,
      totalPages: 1
    },
    staleTime: 30 * 1000, // 30 segundos de cache
    retry: 2
  });
}

export function useContact(id: number | null) {
  return useQuery<ContactWithTags>({
    queryKey: ['/api/contacts', id],
    queryFn: async () => {
      if (!id) throw new Error('Contact ID is required');
      const response = await fetch(`/api/contacts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json();
    },
    enabled: !!id
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: InsertContact) => {
      const response = await apiRequest('POST', '/api/contacts', contact);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    }
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contact }: { id: number; contact: Partial<InsertContact> }) => {
      const response = await apiRequest('PUT', `/api/contacts/${id}`, contact);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', id] });
    }
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/contacts/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    }
  });
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
      return response;
    }
  });
}

export function useBlockContact() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', `/api/zapi/contacts/${encodeURIComponent(phone)}/block`);
      return response;
    }
  });
}

export function useImportZApiContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/zapi/import-contacts');
      return response;
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