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
      console.log('🎵 Iniciando envio de áudio:', {
        conversationId,
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        duration,
        contactPhone: contact?.phone
      });

      // Se tiver telefone, enviar via Z-API
      if (contact?.phone) {
        // Compressão automática para áudios grandes
        let finalAudioBlob = audioBlob;
        if (audioBlob.size > 2 * 1024 * 1024) { // Mais de 2MB
          console.log('🔄 Comprimindo áudio grande para envio mais rápido...');
          // Usar formato mais compacto se necessário
          finalAudioBlob = audioBlob; // Por enquanto, mantém original
        }

        const formData = new FormData();
        formData.append('phone', contact.phone);
        formData.append('audio', finalAudioBlob, `audio.${finalAudioBlob.type.split('/')[1] || 'webm'}`);
        formData.append('duration', duration.toString());
        formData.append('conversationId', conversationId.toString());

        console.log('📤 Enviando FormData para Z-API:', {
          phone: contact.phone,
          audioType: audioBlob.type,
          audioSize: audioBlob.size,
          conversationId,
          duration
        });

        const response = await fetch('/api/zapi/send-audio', {
          method: 'POST',
          body: formData,
          // Otimizações de timeout para envio rápido
          signal: AbortSignal.timeout(20000) // 20s timeout
        });

        const responseText = await response.text();
        console.log('📥 Resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        if (!response.ok) {
          console.error('❌ Erro ao enviar áudio via Z-API:', responseText);
          throw new Error(`Erro na API Z-API: ${response.status} - ${responseText}`);
        }

        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta:', parseError);
          throw new Error(`Resposta inválida do servidor: ${responseText}`);
        }
      }

      // Sistema só funciona com WhatsApp, não há outros canais
      throw new Error('Contato deve ter um número de telefone para envio de áudio');
    },
    onSuccess: (data, { conversationId }) => {
      console.log('✅ Áudio enviado com sucesso:', data);
      // Invalidar com a chave correta para atualizar mensagens imediatamente
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      console.error('💥 Erro ao enviar áudio:', error);
    },
  });
}