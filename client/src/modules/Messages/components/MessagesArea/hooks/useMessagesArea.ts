import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMessages } from '@/shared/lib/hooks/useMessages';

export function useMessagesArea(activeConversation: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reduzir limite para melhorar performance inicial
  const { data: messagesData = [], isLoading } = useMessages(
    activeConversation?.id || null,
    25, // Reduzido de 30 para 25
  );

  // LOG DE DEPURAÇÃO
  console.log('[DEBUG] messagesData:', messagesData);

  const messages = useMemo(
    () => (Array.isArray(messagesData) ? messagesData : []),
    [messagesData],
  );

  // LOG DE DEPURAÇÃO
  console.log('[DEBUG] messages:', messages);

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

  // Scroll on new message - otimizado para evitar scroll duplo
  useEffect(() => {
    const shouldScroll = messages.length > prevMessageCount.current && 
                        hasAutoScrolled && 
                        !isLoading && 
                        activeConversation?.id === prevConversationId.current;
    
    if (shouldScroll) {
      scrollToBottom();
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, hasAutoScrolled, isLoading, activeConversation?.id, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleReply,
  };
}