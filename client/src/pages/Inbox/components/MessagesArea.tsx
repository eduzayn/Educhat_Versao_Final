import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { MessageBubble } from '../../../modules/Messages/components/MessageBubble';

interface MessagesAreaProps {
  messages: any[];
  isLoadingMessages: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  activeConversation: any;
  getChannelInfo: (channel: string) => { icon: string; color: string; label: string };
}

export function MessagesArea({
  messages,
  isLoadingMessages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  activeConversation,
  getChannelInfo
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const [isNearTop, setIsNearTop] = useState(false);
  const loadingRef = useRef<boolean>(false);

  // Função para rolar para o final
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  // Detectar scroll próximo ao topo para carregar mais mensagens
  const handleScroll = () => {
    if (!containerRef.current || !fetchNextPage || loadingRef.current) return;
    
    const { scrollTop } = containerRef.current;
    const nearTop = scrollTop < 100; // 100px do topo
    
    setIsNearTop(nearTop);
    
    // Carregar mais mensagens quando próximo ao topo
    if (nearTop && hasNextPage && !isFetchingNextPage) {
      loadingRef.current = true;
      const previousScrollHeight = containerRef.current.scrollHeight;
      const previousScrollTop = containerRef.current.scrollTop;
      
      fetchNextPage().then(() => {
        // Manter posição do scroll após carregar novas mensagens
        setTimeout(() => {
          if (containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const heightDifference = newScrollHeight - previousScrollHeight;
            containerRef.current.scrollTop = previousScrollTop + heightDifference;
          }
          loadingRef.current = false;
        }, 50);
      });
    }
  };

  // Rolar para o final quando novas mensagens chegarem (apenas se não estiver carregando histórico)
  useEffect(() => {
    if (messages.length > prevMessageCount.current && messages.length > 0 && !loadingRef.current) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Rolar para o final no carregamento inicial
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [messages.length > 0, isLoadingMessages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {(messages || []).length === 0 && !isLoadingMessages ? (
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
          {isLoadingMessages && (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-sm">Carregando mensagens...</p>
            </div>
          )}
          
          {/* Lista de mensagens em ordem cronológica */}
          {(messages || []).map((message) => (
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