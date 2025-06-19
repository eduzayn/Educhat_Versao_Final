import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualization } from '@/shared/lib/hooks/useVirtualization';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import type { Message, Contact } from '@shared/schema';

interface VirtualizedMessageListProps {
  messages: Message[];
  contact: Contact;
  conversationId?: number;
  onReply?: (message: Message) => void;
  className?: string;
  estimatedItemHeight?: number;
  overscan?: number;
}

export function VirtualizedMessageList({
  messages,
  contact,
  conversationId,
  onReply,
  className = '',
  estimatedItemHeight = 80,
  overscan = 10
}: VirtualizedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calcular altura estimada baseada no tipo de mensagem
  const getEstimatedHeight = useCallback((message: Message): number => {
    switch (message.messageType) {
      case 'image':
        return 200;
      case 'video':
        return 250;
      case 'audio':
        return 60;
      case 'document':
        return 100;
      case 'sticker':
        return 150;
      default:
        // Calcular altura baseada no conteúdo de texto
        const textLength = message.content?.length || 0;
        const lines = Math.ceil(textLength / 50); // ~50 caracteres por linha
        return Math.max(60, lines * 20 + 40); // 20px por linha + padding
    }
  }, []);

  // Calcular alturas dinâmicas das mensagens
  const messageHeights = useMemo(() => {
    return messages.map((message, index) => ({
      index,
      height: getEstimatedHeight(message)
    }));
  }, [messages, getEstimatedHeight]);

  // Hook de virtualização com alturas dinâmicas
  const {
    virtualItems,
    totalHeight,
    containerRef: setVirtualContainerRef,
    scrollToBottom
  } = useVirtualization(messages, {
    itemHeight: estimatedItemHeight,
    overscan,
    containerHeight
  });

  // Atualizar altura do container
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setContainerHeight(height);
      }
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    return () => window.removeEventListener('resize', updateContainerHeight);
  }, []);

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messages.length > 0) {
      // Pequeno delay para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Combinar refs
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setVirtualContainerRef(node);
  }, [setVirtualContainerRef]);

  // Renderizar item virtualizado
  const renderVirtualItem = useCallback(({ index, data: message, offsetTop }: any) => {
    return (
      <div
        key={`${message.id}-${index}`}
        style={{
          position: 'absolute',
          top: offsetTop,
          left: 0,
          right: 0,
          height: messageHeights[index]?.height || estimatedItemHeight
        }}
      >
        <MessageBubble
          message={message}
          contact={contact}
          conversationId={conversationId}
          onReply={onReply}
          index={index}
          isVisible={true}
        />
      </div>
    );
  }, [contact, conversationId, onReply, messageHeights, estimatedItemHeight]);

  return (
    <div
      ref={combinedRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(renderVirtualItem)}
      </div>
    </div>
  );
}
