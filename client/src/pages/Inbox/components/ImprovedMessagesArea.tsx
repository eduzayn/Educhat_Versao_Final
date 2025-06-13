import { useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from '../../../shared/components/MessageBubble';
import { Skeleton } from '../../../components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Message } from '@shared/schema';

interface ImprovedMessagesAreaProps {
  activeConversation: any;
  getChannelInfo: (channel: string) => { icon: string; color: string; label: string };
}

export function ImprovedMessagesArea({
  activeConversation,
  getChannelInfo
}: ImprovedMessagesAreaProps) {
  const {
    data: messages = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [`/api/conversations/${activeConversation?.id}/messages`],
    queryFn: async () => {
      if (!activeConversation?.id) return [];
      
      const response = await fetch(
        `/api/conversations/${activeConversation.id}/messages?limit=200&offset=0`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.messages || [];
    },
    enabled: !!activeConversation?.id,
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    refetchOnWindowFocus: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationId = useRef<number | undefined>();

  // Group messages by date for better organization
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
        dateKey = format(date, 'dd/MM/yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  // Auto-scroll to bottom when new messages arrive or conversation changes
  useEffect(() => {
    if (activeConversation?.id !== prevConversationId.current) {
      prevConversationId.current = activeConversation?.id;
      // Delay scroll to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeConversation?.id, messages]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar mensagens
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Não foi possível carregar as mensagens desta conversa.'}
          </p>
        </div>
      </div>
    );
  }

  // No conversation selected
  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
          <p>Escolha uma conversa da lista para ver as mensagens</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const dateKeys = Object.keys(groupedMessages).sort((a, b) => {
    // Sort dates: Hoje, Ontem, then chronological order
    if (a === 'Hoje') return -1;
    if (b === 'Hoje') return 1;
    if (a === 'Ontem') return -1;
    if (b === 'Ontem') return 1;
    return new Date(a.split('/').reverse().join('-')).getTime() - 
           new Date(b.split('/').reverse().join('-')).getTime();
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2"
      style={{ 
        maxHeight: 'calc(100vh - 200px)',
        scrollBehavior: 'smooth'
      }}
    >
      {dateKeys.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem</h3>
            <p>Esta conversa ainda não possui mensagens</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map(dateKey => (
            <div key={dateKey} className="space-y-3">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm text-gray-600 font-medium">
                    {dateKey}
                  </span>
                </div>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-2">
                {groupedMessages[dateKey]
                  .sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime())
                  .map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      activeConversation={activeConversation}
                      getChannelInfo={getChannelInfo}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
}