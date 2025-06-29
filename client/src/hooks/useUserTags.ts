import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserTag, InsertUserTag } from '../../../shared/schema';
import { useToast } from '@/hooks/use-toast';

// Hook para buscar todas as tags do usuário
export function useUserTags() {
  return useQuery({
    queryKey: ['/api/user-tags'],
    queryFn: () => apiRequest('/api/user-tags'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar estatísticas das tags
export function useUserTagStats() {
  return useQuery({
    queryKey: ['/api/user-tags/stats'],
    queryFn: () => apiRequest('/api/user-tags/stats'),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar tags de um contato específico
export function useContactTags(contactId: number) {
  return useQuery({
    queryKey: ['/api/user-tags/contacts', contactId],
    queryFn: () => apiRequest(`/api/user-tags/contacts/${contactId}`),
    enabled: !!contactId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para criar nova tag
export function useCreateUserTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<InsertUserTag, 'createdBy'>) => 
      apiRequest('/api/user-tags', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (newTag: UserTag) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/stats'] });
      toast({
        title: "Tag criada com sucesso",
        description: `A tag "${newTag.name}" foi criada.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tag",
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar tag existente
export function useUpdateUserTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertUserTag> }) =>
      apiRequest(`/api/user-tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedTag: UserTag) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/stats'] });
      toast({
        title: "Tag atualizada",
        description: `A tag "${updatedTag.name}" foi atualizada.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tag",
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar tag
export function useDeleteUserTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tagId: number) =>
      apiRequest(`/api/user-tags/${tagId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/stats'] });
      // Invalidar também cache de tags de contatos
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/contacts'] });
      toast({
        title: "Tag deletada",
        description: "A tag foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar tag",
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
}

// Hook para aplicar tag a um contato
export function useApplyTagToContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tagId, contactId }: { tagId: number; contactId: number }) =>
      apiRequest(`/api/user-tags/${tagId}/contacts/${contactId}`, {
        method: 'POST',
      }),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/stats'] });
      toast({
        title: "Tag aplicada",
        description: "A tag foi aplicada ao contato com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar tag",
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
}

// Hook para remover tag de um contato
export function useRemoveTagFromContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tagId, contactId }: { tagId: number; contactId: number }) =>
      apiRequest(`/api/user-tags/${tagId}/contacts/${contactId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-tags/stats'] });
      toast({
        title: "Tag removida",
        description: "A tag foi removida do contato com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover tag",
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
}