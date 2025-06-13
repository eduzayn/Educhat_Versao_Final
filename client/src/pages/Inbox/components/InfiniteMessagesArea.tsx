import { useEffect, useRef, useCallback } from 'react';
import { MessageSquare, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { MessageBubble } from '../../../modules/Messages/components/MessageBubble';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Message } from '@shared/schema';

interface InfiniteMessagesAreaProps {
  activeConversation: any;
  getChannelInfo: (channel: string) => { icon: string; color: string; label: string };
}

export function InfiniteMessagesArea({
  activeConversation,
  getChannelInfo
}: InfiniteMessagesAreaProps) {
  const {
    data: allMessages = [],
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useInfiniteMessages(activeConversation?.id || null, 200);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.sentAt || Date.now());
      let dateKey: string;
      
      if (isToday(date)) {
        dateKey = 'Hoje';
      } else if (isYesterday(date)) {
        dateKey = 'Ontem';
      } else {
        dateKey = format(date, "dd/MM/yyyy", { locale: ptBR });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(allMessages);

  // Intersection Observer for loading more messages at the top
  const topSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px 0px 0px 0px'
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto scroll to bottom when conversation changes
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [activeConversation?.id]);

  // Manual scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Erro ao carregar mensagens</p>
          <p className="text-sm mt-1">{error?.message || 'Tente recarregar a página'}</p>
        </div>
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm">Envie uma mensagem para começar a conversa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pt-4">
        {/* Top loading indicator and sentinel */}
        <div ref={topSentinelRef} className="h-4">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-sm text-gray-500">Carregando mensagens anteriores...</span>
            </div>
          )}
          {!hasNextPage && allMessages.length > 50 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Início da conversa
            </div>
          )}
        </div>

        {/* Messages grouped by date */}
        <div className="space-y-6 pb-4">
          {Object.entries(messageGroups).map(([dateLabel, messages]) => (
            <div key={dateLabel} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {dateLabel}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  contact={activeConversation?.contact}
                  channelIcon={getChannelInfo(activeConversation?.channel || '').icon}
                  channelColor={getChannelInfo(activeConversation?.channel || '').color}
                  conversationId={activeConversation?.id || 0}
                  onReply={(message) => {
                    // Extract messageId from message metadata
                    const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata : {};
                    let messageId = null;
                    
                    if ("messageId" in metadata && metadata.messageId) {
                      messageId = metadata.messageId;
                    } else if ("zaapId" in metadata && metadata.zaapId) {
                      messageId = metadata.zaapId;
                    } else if ("id" in metadata && metadata.id) {
                      messageId = metadata.id;
                    }
                    
                    // Send event to InputArea via custom event
                    window.dispatchEvent(new CustomEvent('replyToMessage', {
                      detail: { messageId, content: message.content }
                    }));
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Scroll to bottom reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll to bottom button */}
      <div className="absolute bottom-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToBottom}
          className="rounded-full w-10 h-10 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-gray-200"
        >
          <ChevronUp className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}