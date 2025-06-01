// Hook de envio de áudio removido - aguardando novas orientações
export function useSendAudioMessage() {
  return {
    mutateAsync: async () => {
      throw new Error('Funcionalidade de envio de áudio temporariamente desabilitada');
    },
    isPending: false
  };
}