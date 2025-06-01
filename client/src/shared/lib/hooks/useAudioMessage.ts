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
        formData.append('conversationId', conversationId.toString());

        const response = await fetch('/api/zapi/send-audio', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Erro na API Z-API: ${response.status}`);
        }

        return await response.json();
      }

      // Sistema só funciona com WhatsApp, não há outros canais
      throw new Error('Contato deve ter um número de telefone para envio de áudio');
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}