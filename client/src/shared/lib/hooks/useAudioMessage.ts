import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useSendAudioMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      audioBlob, 
      duration, 
      contact 
    }: { 
      conversationId: number; 
      audioBlob: Blob;
      duration: number;
      contact?: any;
    }) => {
      // Se tiver telefone, enviar via Z-API
      if (contact?.phone) {
        const formData = new FormData();
        formData.append('phone', contact.phone);
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('duration', duration.toString());

        try {
          const response = await fetch('/api/zapi/send-audio', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Erro na API Z-API: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Erro ao enviar áudio via Z-API:', error);
          throw error;
        }
      }

      // Para outros canais, salvar no banco local
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('duration', duration.toString());
      formData.append('messageType', 'audio');

      const response = await fetch(`/api/conversations/${conversationId}/messages/audio`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar áudio: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}