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
  
  // Consolidar todas as mensagens das páginas
  const messages = useMemo(() => {
    if (!messagesQuery.data) return [];
    return messagesQuery.data.pages.flatMap(page => page.messages);
  }, [messagesQuery.data]);

  const isLoading = messagesQuery.isLoading;
  const hasNextPage = messagesQuery.hasNextPage;
  const fetchNextPage = messagesQuery.fetchNextPage;

  // Otimização: Scroll mais eficiente com debounce
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesEndRef.current) {
        // Usar scrollTop para melhor performance que scrollIntoView
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        } else {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }
    }, 50); // Debounce de 50ms
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

  // Scroll on conversation change - otimizado para evitar scroll redundante
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      prevMessageCount.current = messages.length;
      setHasAutoScrolled(true);
      
      // Scroll imediato para nova conversa sem setTimeout
      if (messages.length > 0) {
        scrollToBottom();
      }
    }
  }, [activeConversation?.id, scrollToBottom]);

  // Scroll automático imediato para novas mensagens
  useEffect(() => {
    const shouldScroll = messages.length > prevMessageCount.current && 
                        (hasAutoScrolled || messages.length === 1) && 
                        activeConversation?.id === prevConversationId.current;
    
    if (shouldScroll) {
      // Scroll imediato para mensagens novas (incluindo temporárias)
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, hasAutoScrolled, activeConversation?.id, scrollToBottom]);

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