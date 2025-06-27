import { useEffect, useRef, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageBubble } from "@/modules/Messages/components/MessageBubble";
import { useMarkConversationRead } from "@/shared/lib/hooks/useMarkConversationRead";

// Funções para agrupamento e formatação de datas
const formatDateSeparator = (date: Date) => {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd 'de' MMMM", { locale: ptBR });
};

const groupMessagesByDate = (messages: any[]) => {
  const groups: { date: Date; messages: any[] }[] = [];

  messages.forEach((message) => {
    const messageDate = new Date(message.sentAt);
    const lastGroup = groups[groups.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        date: messageDate,
        messages: [message],
      });
    }
  });

  return groups;
};

// Componente para o separador de data
const DateSeparator = ({ date }: { date: Date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full shadow-sm">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {formatDateSeparator(date)}
      </span>
    </div>
  </div>
);

interface MessagesAreaProps {
  messages: any[];
  isLoadingMessages: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => Promise<any>;
  activeConversation: any;
  getChannelInfo: (channel: string) => {
    icon: string;
    color: string;
    label: string;
  };
}

export function MessagesArea({
  messages,
  isLoadingMessages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  activeConversation,
  getChannelInfo,
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();
  const prevMessageCount = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);
  const [isNearTop, setIsNearTop] = useState(false);
  const markAsReadMutation = useMarkConversationRead();

  // Função para remover mensagens duplicadas e garantir keys únicas
  const deduplicateMessages = (messages: any[]) => {
    const seenIds = new Set<string>();
    const uniqueMessages: any[] = [];
    
    messages.forEach((message, index) => {
      if (!message?.id) {
        // Se não tem ID, gerar um temporário baseado no conteúdo e posição
        console.warn('Mensagem sem ID detectada:', message);
        return;
      }
      
      const messageKey = `${message.id}-${message.sentAt || ''}`;
      
      if (seenIds.has(messageKey)) {
        console.warn(`Mensagem duplicada detectada: ID ${message.id}, sentAt: ${message.sentAt}`);
        return;
      }
      
      seenIds.add(messageKey);
      uniqueMessages.push(message);
    });
    
    return uniqueMessages;
  };

  // Rola automaticamente para o fim da conversa
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Ao mudar de conversa
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      prevMessageCount.current = messages.length;
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversation?.id]);

  // Auto-marcar como lida quando conversa com mensagens não lidas é aberta
  useEffect(() => {
    if (
      activeConversation?.id && 
      activeConversation.unreadCount > 0 && 
      !activeConversation.markedUnreadManually
    ) {
      // Aguarda um momento para garantir que a conversa foi carregada
      const timer = setTimeout(() => {
        markAsReadMutation.mutate(activeConversation.id);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activeConversation?.id, activeConversation?.unreadCount, activeConversation?.markedUnreadManually, markAsReadMutation]);

  // Carregar mensagens antigas ao rolar para o topo
  const handleScroll = () => {
    if (!containerRef.current || !fetchNextPage || loadingRef.current) return;
    const { scrollTop } = containerRef.current;

    const nearTop = scrollTop < 50;
    setIsNearTop(nearTop);

    if (nearTop && hasNextPage && !isFetchingNextPage) {
      loadingRef.current = true;

      const previousScrollHeight = containerRef.current.scrollHeight;
      const previousScrollTop = containerRef.current.scrollTop;

      fetchNextPage().finally(() => {
        setTimeout(() => {
          if (containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            containerRef.current.scrollTop =
              previousScrollTop + (newScrollHeight - previousScrollHeight);
          }
          loadingRef.current = false;
        }, 100);
      });
    }
  };

  // Rolar ao final quando novas mensagens forem adicionadas
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCount.current;
    if (isNewMessage && !loadingRef.current) {
      setTimeout(scrollToBottom, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Scroll inicial ao carregar mensagens
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      setTimeout(scrollToBottom, 200);
    }
  }, [isLoadingMessages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {messages.length === 0 && !isLoadingMessages ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-center">
          <div>
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">
              Envie uma mensagem para começar a conversa
            </p>
          </div>
        </div>
      ) : (
        <>
          {isFetchingNextPage && (
            <div className="flex justify-center py-4 text-sm text-gray-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando mensagens anteriores...
            </div>
          )}

          {!hasNextPage && messages.length > 15 && (
            <div className="flex justify-center py-4 text-xs text-gray-400">
              Início da conversa
            </div>
          )}

          {isLoadingMessages && (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
              <p className="text-sm">Carregando mensagens...</p>
            </div>
          )}

          {/* Renderizar mensagens agrupadas por data */}
          {groupMessagesByDate(
            deduplicateMessages(messages ?? []).sort(
              (a, b) =>
                new Date(a.sentAt || 0).getTime() -
                new Date(b.sentAt || 0).getTime(),
            )
          ).map((group, groupIndex) => (
            <div key={`group-${group.date.getTime()}`}>
              {/* Separador de data */}
              <DateSeparator date={group.date} />
              
              {/* Mensagens do grupo com espaçamento reduzido */}
              <div className="space-y-2">
                {group.messages.map((message, messageIndex) => (
                <MessageBubble
                  key={`msg-${message.id}-${message.sentAt || ''}-${messageIndex}`}
                  message={message}
                  contact={activeConversation?.contact}
                  channelIcon={
                    getChannelInfo(activeConversation?.channel || "").icon
                  }
                  channelColor={
                    getChannelInfo(activeConversation?.channel || "").color
                  }
                  conversationId={activeConversation?.id || 0}
                  onReply={(message) => {
                    const metadata =
                      typeof message.metadata === "object"
                        ? message.metadata
                        : {};
                    const messageId =
                      (metadata as any)?.messageId ||
                      (metadata as any)?.zaapId ||
                      (metadata as any)?.id ||
                      null;

                    window.dispatchEvent(
                      new CustomEvent("replyToMessage", {
                        detail: { messageId, content: message.content },
                      }),
                    );
                  }}
                />
              ))}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
