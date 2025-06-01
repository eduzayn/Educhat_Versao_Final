import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Função para converter Blob para base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove o prefixo "data:audio/webm;codecs=opus;base64," para obter apenas o base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Erro ao converter áudio para base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

export function useSendAudioMessage() {
  return useMutation({
    mutationFn: async ({ phone, audioBlob }: { phone: string; audioBlob: Blob }) => {
      // Converte o áudio para base64 conforme documentação Z-API
      const audioBase64 = await blobToBase64(audioBlob);
      
      return await apiRequest({
        url: '/api/zapi/send-audio',
        method: 'POST',
        body: {
          phone,
          audio: audioBase64
        }
      });
    }
  });
}