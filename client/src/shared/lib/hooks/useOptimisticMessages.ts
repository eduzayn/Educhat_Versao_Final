import { useState, useCallback, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import type { Message } from '@shared/schema';

interface OptimisticMessage extends Omit<Message, 'id'> {
  id: number | string;
  isOptimistic?: boolean;
  optimisticId?: string;
}

// Performance benchmark para medir ENTER → Bubble
const performanceBenchmark = {
  timers: new Map<string, number>(),
  
  startTimer(name: string) {
    this.timers.set(name, performance.now());
  },
  
  endTimer(name: string): number {
    const start = this.timers.get(name);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.timers.delete(name);
    return duration;
  }
};

export function useOptimisticMessages(conversationId: number) {
  const [optimisticCounter, setOptimisticCounter] = useState(0);
  const pendingOptimistic = useRef(new Map<string, OptimisticMessage>());

  const addOptimisticMessage = useCallback((messageContent: string, messageType: 'text' | 'image' | 'audio' = 'text') => {
    // BENCHMARK: Iniciar cronômetro ENTER → Bubble
    performanceBenchmark.startTimer('enter-to-bubble');
    
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    
    const optimisticMessage: OptimisticMessage = {
      id: optimisticId,
      conversationId,
      content: messageContent,
      isFromContact: false,
      messageType,
      metadata: null,
      isDeleted: false,
      sentAt: timestamp,
      deliveredAt: null,
      readAt: null,
      whatsappMessageId: null,
      zapiStatus: 'PENDING',
      isGroup: false,
      referenceMessageId: null,
      isInternalNote: false,
      authorId: null,
      authorName: null,
      noteType: 'general',
      notePriority: 'normal',
      noteTags: null,
      isPrivate: false,
      isHiddenForUser: false,
      isDeletedByUser: false,
      deletedAt: null,
      deletedBy: null,
      isOptimistic: true,
      optimisticId
    };

    // Armazenar mensagem otimística para substituição posterior
    pendingOptimistic.current.set(optimisticId, optimisticMessage);

    // RENDERIZAÇÃO IMEDIATA: Adicionar mensagem ao cache instantaneamente
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: Message[] | undefined) => {
        const messages = oldMessages || [];
        const updatedMessages = [...messages, optimisticMessage as Message];
        
        // BENCHMARK: Finalizar cronômetro - mensagem renderizada
        const renderTime = performanceBenchmark.endTimer('enter-to-bubble');
        console.log(`🎯 PERFORMANCE OTIMÍSTICA: ENTER → Bubble em ${renderTime.toFixed(1)}ms (Target: <50ms)`);
        
        return updatedMessages;
      }
    );

    // Incrementar contador para forçar re-render se necessário
    setOptimisticCounter(prev => prev + 1);

    return optimisticId;
  }, [conversationId]);

  const replaceOptimisticMessage = useCallback((optimisticId: string, realMessage: Message) => {
    console.log(`🔄 Substituindo mensagem otimística ${optimisticId} pela real ${realMessage.id}`);
    
    // Remover da lista de pendentes
    pendingOptimistic.current.delete(optimisticId);

    // Substituir mensagem otimística pela real no cache
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [realMessage];
        
        return oldMessages.map(msg => {
          // Se for a mensagem otimística, substituir pela real
          const optimisticMsg = msg as OptimisticMessage;
          if (optimisticMsg.optimisticId === optimisticId || String(msg.id) === optimisticId) {
            return realMessage;
          }
          return msg;
        });
      }
    );
  }, [conversationId]);

  const removeOptimisticMessage = useCallback((optimisticId: string) => {
    console.warn(`❌ Removendo mensagem otimística ${optimisticId} devido a erro`);
    
    // Remover da lista de pendentes
    pendingOptimistic.current.delete(optimisticId);

    // Remover mensagem otimística do cache
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        
        return oldMessages.filter(msg => {
          const isOptimistic = (msg as OptimisticMessage).optimisticId === optimisticId || msg.id === optimisticId;
          return !isOptimistic;
        });
      }
    );
  }, [conversationId]);

  const getPendingOptimisticMessages = useCallback(() => {
    return Array.from(pendingOptimistic.current.values());
  }, []);

  const clearAllOptimistic = useCallback(() => {
    console.log('🧹 Limpando todas as mensagens otimísticas pendentes');
    pendingOptimistic.current.clear();
  }, []);

  return {
    addOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    getPendingOptimisticMessages,
    clearAllOptimistic,
    optimisticCounter
  };
}