import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import type { Message } from '@shared/schema';

interface MessagesListProps {
  conversationId: number;
}

export function MessagesList({ conversationId }: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId
  });

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // Fazer scroll quando novas mensagens chegarem
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Erro ao carregar mensagens</p>
          <p className="text-sm mt-1">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm mt-1">Comece uma conversa!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message: Message, index: number) => {
        const showAvatar = index === 0 || 
          messages[index - 1]?.isFromContact !== message.isFromContact;
        
        const contactName = message.isFromContact ? 'Contato' : 'Você';

        return (
          <MessageBubble
            key={message.id}
            message={message}
            contactName={contactName}
            showAvatar={showAvatar}
          />
        );
      })}
      
      {/* Elemento invisible para scroll automático */}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
}