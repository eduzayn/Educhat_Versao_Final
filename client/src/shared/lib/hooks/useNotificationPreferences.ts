import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationPreferences, InsertNotificationPreferences } from "@shared/schema";

// Hook para buscar preferências do usuário
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para atualizar preferências
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<InsertNotificationPreferences>) => {
      return apiRequest(`/api/notification-preferences`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/notification-preferences"], data);
    },
  });
}

// Hook para fazer toggle de uma configuração específica
export function useToggleNotificationSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setting: string) => {
      return apiRequest(`/api/notification-preferences/toggle/${setting}`, {
        method: "PATCH",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/notification-preferences"], data.preferences);
    },
  });
}

// Hook para resetar para valores padrão
export function useResetNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/notification-preferences/reset`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/notification-preferences"], data);
    },
  });
}

// Hook para verificar se deve notificar
export function useCheckNotification(type: string, messageType?: string) {
  return useQuery<{ shouldNotify: boolean; type: string; messageType?: string }>({
    queryKey: ["/api/notification-preferences/check", type, messageType],
    queryFn: async () => {
      const params = messageType ? `?messageType=${messageType}` : '';
      return apiRequest(`/api/notification-preferences/check/${type}${params}`);
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    enabled: !!type,
  });
}