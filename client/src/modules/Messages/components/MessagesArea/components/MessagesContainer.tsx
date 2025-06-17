import { useEffect, useRef, useCallback, useState } from 'react';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';

interface MessagesContainerProps {
  messages: any[];
  activeConversation: any;
  getChannelInfo: (channel: string) => {
    icon: string;
    color: string;
    label: string;
  };
  onReply: (message: any) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  loadPreviousMessages?: () => Promise<void>;
  isLoading?: boolean;
}

export function MessagesContainer({
  messages,
  activeConversation,
  getChannelInfo,
  onReply,
  messagesEndRef,
  hasNextPage = false,
  loadPreviousMessages,
  isLoading = false,
}: MessagesContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);

  // Detectar scroll no topo para carregar mensagens anteriores
  const handleScroll = useCallback((e: Event) => {
    const container = e.target as HTMLDivElement;
    if (!container || isLoadingMoreRef.current || !hasNextPage || !loadPreviousMessages) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearTop = scrollTop < 100; // 100px do topo

    if (isNearTop) {
      console.log('🔄 Scroll no topo detectado - carregando mensagens anteriores...');
      isLoadingMoreRef.current = true;
      
      loadPreviousMessages().finally(() => {
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
    }
  }, [hasNextPage, loadPreviousMessages]);

  // Configurar listener de scroll
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Mostrar botão de "Carregar mais" se houver mais mensagens
  useEffect(() => {
    setShowLoadMoreButton(hasNextPage && messages.length > 0);
  }, [hasNextPage, messages.length]);

  return (
    <div ref={containerRef}>
      {/* Botão de carregar mais mensagens anteriores */}
      {showLoadMoreButton && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => loadPreviousMessages?.()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Carregando...' : 'Carregar mensagens anteriores'}
          </button>
        </div>
      )}

      {/* Indicador de carregamento */}
      {isLoading && messages.length > 0 && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Carregando mensagens...</span>
          </div>
        </div>
      )}

      {/* Lista de mensagens */}
      {messages.map((message: any) => (
        <MessageBubble
          key={message.id}
          message={message}
          contact={activeConversation?.contact}
          channelIcon={
            getChannelInfo(activeConversation?.channel || '').icon
          }
          channelColor={
            getChannelInfo(activeConversation?.channel || '').color
          }
          conversationId={activeConversation?.id || 0}
          onReply={onReply}
        />
      ))}
      
      {/* Referência para scroll automático para o final */}
      <div ref={messagesEndRef} />
    </div>
  );
}