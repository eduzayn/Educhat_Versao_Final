import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMessages } from '@/shared/lib/hooks/useMessages';

export function useMessagesArea(activeConversation: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);

  const { data: messagesData = [], isLoading } = useMessages(
    activeConversation?.id || null,
    30,
  );

  const messages = useMemo(
    () => (Array.isArray(messagesData) ? messagesData : []),
    [messagesData],
  );

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Scroll on conversation change
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      prevMessageCount.current = messages.length;
      setHasAutoScrolled(true);
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversation?.id, messages.length, scrollToBottom]);

  // Scroll on new message if not scrolled manually
  useEffect(() => {
    if (messages.length > prevMessageCount.current && hasAutoScrolled) {
      setTimeout(scrollToBottom, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, hasAutoScrolled, scrollToBottom]);

  // Initial scroll
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(scrollToBottom, 200);
    }
  }, [messages.length, isLoading, scrollToBottom]);

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleReply,
  };
}