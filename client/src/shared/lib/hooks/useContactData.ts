import { useQuery } from '@tanstack/react-query';

export interface ContactNote {
  id: number;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface ContactDeal {
  id: number;
  title: string;
  value: number;
  status: string;
  createdAt: string;
}

export interface ContactInterest {
  id: number;
  name: string;
  category: string;
  createdAt: string;
}

// Hook unificado para buscar todas as informações do contato
export function useContactData(contactId: number | null) {
  const notesQuery = useQuery({
    queryKey: ['contacts', contactId, 'notes'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (!response.ok) throw new Error('Erro ao buscar notas do contato');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const dealsQuery = useQuery({
    queryKey: ['contacts', contactId, 'deals'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/deals`);
      if (!response.ok) throw new Error('Erro ao buscar negócios do contato');
      const data = await response.json();
      return Array.isArray(data.deals) ? data.deals : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const interestsQuery = useQuery({
    queryKey: ['contacts', contactId, 'interests'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/interests`);
      if (!response.ok) throw new Error('Erro ao buscar interesses do contato');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    notes: notesQuery.data || [],
    deals: dealsQuery.data || [],
    interests: interestsQuery.data || [],
    isLoading: notesQuery.isLoading || dealsQuery.isLoading || interestsQuery.isLoading,
    isError: notesQuery.isError || dealsQuery.isError || interestsQuery.isError,
    error: notesQuery.error || dealsQuery.error || interestsQuery.error,
    refetch: () => {
      notesQuery.refetch();
      dealsQuery.refetch();
      interestsQuery.refetch();
    },
  };
}

// Hooks individuais para casos específicos
export function useContactNotes(contactId: number | null) {
  return useQuery<ContactNote[]>({
    queryKey: ['contacts', contactId, 'notes'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (!response.ok) throw new Error('Erro ao buscar notas do contato');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useContactDeals(contactId: number | null) {
  return useQuery<ContactDeal[]>({
    queryKey: ['contacts', contactId, 'deals'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/deals`);
      if (!response.ok) throw new Error('Erro ao buscar negócios do contato');
      const data = await response.json();
      return Array.isArray(data.deals) ? data.deals : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useContactInterests(contactId: number | null) {
  return useQuery<ContactInterest[]>({
    queryKey: ['contacts', contactId, 'interests'],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await fetch(`/api/contacts/${contactId}/interests`);
      if (!response.ok) throw new Error('Erro ao buscar interesses do contato');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });
}