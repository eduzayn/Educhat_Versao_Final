import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { MessageBubble } from '../../../modules/Messages/components/MessageBubble';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { useInfiniteMessages } from '@/shared/lib/hooks/useInfiniteMessages';

interface MessagesAreaProps {
  activeConversation: any;
  getChannelInfo: (channel: string) => { icon: string; color: string; label: string };
}

export function MessagesArea({
  activeConversation,
  getChannelInfo
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Use messages hook for loading messages
  const {
    data: messages = [],
    isLoading
  } = useMessages(activeConversation?.id || null, 100);

  // Função para rolar para o final
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle scroll for future infinite loading if needed
  const handleScroll = useCallback(() => {
    // Scroll handling placeholder for future infinite scroll implementation
  }, []);

  // Rolar para o final quando a conversa mudar
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      prevMessageCount.current = messages.length;
      
      // Aguardar renderização e rolar para o final
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [activeConversation?.id, messages.length]);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messages.length > prevMessageCount.current && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Rolar para o final no carregamento inicial
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [messages.length > 0, isLoading, scrollToBottom]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Loading indicator for fetching older messages */}
      {isFetchingNextPage && (
        <div className="p-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-xs text-gray-500">Carregando mensagens anteriores...</p>
        </div>
      )}

      {(messages || []).length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie uma mensagem para começar a conversa</p>
          </div>
        </div>
      ) : (
        <>
          {/* Loading inicial */}
          {isLoading && messages.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p className="text-sm">Carregando mensagens...</p>
            </div>
          )}
          
          {/* Lista de mensagens em ordem cronológica */}
          {(messages || []).map((message: any) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              contact={activeConversation?.contact}
              channelIcon={getChannelInfo(activeConversation?.channel || '').icon}
              channelColor={getChannelInfo(activeConversation?.channel || '').color}
              conversationId={activeConversation?.id || 0}
              onReply={(message) => {
                // Extrair messageId dos metadados da mensagem
                const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata : {};
                let messageId = null;
                
                if ("messageId" in metadata && metadata.messageId) {
                  messageId = metadata.messageId;
                } else if ("zaapId" in metadata && metadata.zaapId) {
                  messageId = metadata.zaapId;
                } else if ("id" in metadata && metadata.id) {
                  messageId = metadata.id;
                }
                
                // Enviar evento para InputArea via custom event
                window.dispatchEvent(new CustomEvent('replyToMessage', {
                  detail: { messageId, content: message.content }
                }));
              }}
            />
          ))}
          
          {/* Elemento invisível para scroll automático */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}