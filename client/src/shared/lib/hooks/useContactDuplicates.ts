import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface DuplicateContactInfo {
  contactId: number;
  name: string;
  phone: string | null;
  canalOrigem: string | null;
  nomeCanal: string | null;
  idCanal: string | null;
  conversationCount: number;
  lastActivity: Date | null;
}

export interface ContactDuplicationResult {
  isDuplicate: boolean;
  duplicates: DuplicateContactInfo[];
  totalDuplicates: number;
  channels: string[];
}

/**
 * Hook para verificar duplicatas de um número de telefone específico
 */
export function useCheckContactDuplicates(phone: string, excludeContactId?: number) {
  return useQuery({
    queryKey: ['/api/contacts/check-duplicates', phone, excludeContactId],
    queryFn: async () => {
      const response = await fetch('/api/contacts/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, excludeContactId })
      });
      if (!response.ok) throw new Error('Erro ao verificar duplicatas');
      return response.json() as Promise<ContactDuplicationResult>;
    },
    enabled: !!phone?.trim(),
    staleTime: 30000, // Cache por 30 segundos para evitar requests desnecessários
  });
}

/**
 * Hook para buscar todos os contatos duplicados do sistema
 */
export function useAllDuplicateContacts() {
  return useQuery({
    queryKey: ['/api/contacts/duplicates'],
    queryFn: async () => {
      const response = await fetch('/api/contacts/duplicates');
      if (!response.ok) throw new Error('Erro ao buscar duplicatas');
      return response.json() as Promise<{[phone: string]: DuplicateContactInfo[]}>;
    },
    staleTime: 60000, // Cache por 1 minuto
  });
}

/**
 * Mutation para verificar duplicatas antes de criar um contato
 */
export function useCheckBeforeCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: { phone?: string | null, userIdentity?: string | null }) => {
      const response = await fetch('/api/contacts/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error('Erro ao verificar duplicatas');
      return response.json() as Promise<ContactDuplicationResult>;
    },
    onSuccess: () => {
      // Invalidar cache de duplicatas após verificação
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/duplicates'] });
    }
  });
}