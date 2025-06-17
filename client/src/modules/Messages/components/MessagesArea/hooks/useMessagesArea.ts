import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useInfiniteMessages } from '@/shared/lib/hooks/useInfiniteMessages';

export function useMessagesArea(activeConversation: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Garantir que sempre temos um ID válido para o hook useInfiniteMessages
  const conversationId = activeConversation?.id || null;
  
  // Usar hook de mensagens infinitas
  const messagesQuery = useInfiniteMessages(conversationId, 25);
  
  // Consolidar todas as mensagens das páginas - mensagens antigas no topo, recentes no final
  const messages = useMemo(() => {
    if (!messagesQuery.data) return [];
    // O backend agora retorna mensagens em ordem cronológica correta (antigas primeiro)
    // Para paginação infinita, as páginas mais antigas vêm primeiro
    const allMessages: any[] = [];
    
    // Adicionar páginas em ordem reversa (páginas mais antigas primeiro)
    for (let i = messagesQuery.data.pages.length - 1; i >= 0; i--) {
      allMessages.push(...messagesQuery.data.pages[i].messages);
    }
    
    return allMessages;
  }, [messagesQuery.data]);

  const isLoading = messagesQuery.isLoading;
  const hasNextPage = messagesQuery.hasNextPage;
  const fetchNextPage = messagesQuery.fetchNextPage;

  // Scroll otimizado para o final das mensagens
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesEndRef.current) {
        console.log('🔄 Executando scroll automático...');
        
        // Buscar o container de scroll (div com overflow-y-auto)
        let scrollContainer = messagesEndRef.current.parentElement;
        
        // Se não encontrou, buscar o container pai
        while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
          scrollContainer = scrollContainer.parentElement;
        }
        
        if (scrollContainer) {
          console.log('✅ Container de scroll encontrado, fazendo scroll para o final');
          // Forçar scroll para o final
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          console.log('⚠️ Container não encontrado, usando fallback scrollIntoView');
          // Fallback para scrollIntoView
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }
      } else {
        console.log('❌ messagesEndRef não encontrado');
      }
    }, 100);
  }, []);

  const handleReply = useCallback((message: any) => {
    const metadata = typeof message.metadata === 'object' ? message.metadata : {};
    const messageId = metadata?.messageId || metadata?.zaapId || metadata?.id;
    
    window.dispatchEvent(
      new CustomEvent('replyToMessage', {
        detail: { messageId, content: message.content },
      }),
    );
  }, []);

  // Scroll automático quando conversa muda
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      prevMessageCount.current = messages.length;
      setHasAutoScrolled(true);
      
      // Dar tempo para as mensagens carregarem antes do scroll
      if (messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    }
  }, [activeConversation?.id, messages.length, scrollToBottom]);

  // Scroll automático para novas mensagens
  useEffect(() => {
    const shouldScroll = messages.length > prevMessageCount.current && 
                        activeConversation?.id === prevConversationId.current;
    
    if (shouldScroll) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, activeConversation?.id, scrollToBottom]);

  // Scroll imediato quando há mensagens temporárias (status 'sending')
  useEffect(() => {
    const hasTemporaryMessage = messages.some((msg: any) => msg.status === 'sending');
    if (hasTemporaryMessage) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Função para carregar mensagens anteriores
  const loadPreviousMessages = useCallback(async () => {
    if (hasNextPage && !isLoading) {
      console.log('🔄 Carregando mensagens anteriores...');
      try {
        await fetchNextPage();
        console.log('✅ Mensagens anteriores carregadas');
      } catch (error) {
        console.error('❌ Erro ao carregar mensagens anteriores:', error);
      }
    }
  }, [hasNextPage, isLoading, fetchNextPage]);

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleReply,
    hasNextPage,
    loadPreviousMessages,
  };
}