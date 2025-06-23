import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

/**
 * Hook para estabilizar mensagens e evitar desaparecimento
 * Sistema de fallback robusto para race conditions
 */
export function useMessageStabilizer() {
  const queryClient = useQueryClient();
  const stabilizationTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingMessages = useRef(new Map<number, Message>());

  const stabilizeMessage = useCallback((conversationId: number, message: Message, optimisticId?: number) => {
    // Guardar mensagem como pendente
    pendingMessages.current.set(message.id, message);

    // Aplicar mensagem imediatamente
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [message];
        
        // Se existe optimisticId, substituir
        if (optimisticId) {
          const optimisticIndex = oldMessages.findIndex(msg => msg.id === optimisticId);
          if (optimisticIndex !== -1) {
            const updatedMessages = [...oldMessages];
            updatedMessages[optimisticIndex] = message;
            return updatedMessages;
          }
        }
        
        // Verificar se mensagem já existe
        const exists = oldMessages.find(msg => msg.id === message.id);
        if (exists) return oldMessages;
        
        // Adicionar nova mensagem
        return [...oldMessages, message];
      }
    );

    // Sistema de estabilização: verificar após 100ms se mensagem ainda existe
    if (stabilizationTimer.current) {
      clearTimeout(stabilizationTimer.current);
    }
    
    stabilizationTimer.current = setTimeout(() => {
      const currentMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']) as Message[] | undefined;
      const messageExists = currentMessages?.find(msg => msg.id === message.id);
      
      if (!messageExists && pendingMessages.current.has(message.id)) {
        console.warn(`🔧 ESTABILIZADOR: Restaurando mensagem que desapareceu ${message.id}`);
        
        // Restaurar mensagem que desapareceu
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          (oldMessages: Message[] | undefined) => {
            if (!oldMessages) return [message];
            const exists = oldMessages.find(msg => msg.id === message.id);
            return exists ? oldMessages : [...oldMessages, message];
          }
        );
      }
      
      // Limpar da memória após estabilização
      pendingMessages.current.delete(message.id);
    }, 100);
  }, [queryClient]);

  const cleanup = useCallback(() => {
    if (stabilizationTimer.current) {
      clearTimeout(stabilizationTimer.current);
      stabilizationTimer.current = null;
    }
    pendingMessages.current.clear();
  }, []);

  return {
    stabilizeMessage,
    cleanup
  };
}