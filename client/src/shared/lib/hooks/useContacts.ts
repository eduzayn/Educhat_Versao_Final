import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Contact, ContactWithTags, InsertContact } from '@shared/schema';

export function useContacts(search?: string) {
  return useQuery<Contact[]>({
    queryKey: ['/api/contacts', { search }],
    queryFn: async () => {
      const url = search ? `/api/contacts?search=${encodeURIComponent(search)}` : '/api/contacts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    }
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
      return response.json();
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
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', id] });
    }
  });
}

// Z-API specific hooks (mantidas para configurações avançadas)
export function useZApiContacts() {
  return useQuery({
    queryKey: ['/api/zapi/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/zapi/contacts');
      if (!response.ok) throw new Error('Failed to fetch Z-API contacts');
      return response.json();
    }
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