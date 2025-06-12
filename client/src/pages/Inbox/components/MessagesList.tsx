import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { VirtualizedMessageList } from '@/modules/Messages/components/VirtualizedMessageList';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { queryClient } from '@/lib/queryClient';
import { io } from 'socket.io-client';
import type { Message, Contact } from '@shared/schema';

interface MessagesListProps {
  conversationId: number;
  contact?: Contact;
}

export function MessagesList({ conversationId, contact }: MessagesListProps) {
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const markAsReadMutation = useMarkConversationRead();
  
  const { data: messages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId
  });

  // Marcar conversa como lida automaticamente quando abrir
  useEffect(() => {
    if (conversationId && Array.isArray(messages) && messages.length > 0) {
      // Aguardar um pouco para garantir que as mensagens foram carregadas
      const timer = setTimeout(() => {
        markAsReadMutation.mutate(conversationId);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [conversationId, messages.length]);

  // Listener para eventos em tempo real
  useEffect(() => {
    if (!conversationId) return;

    const socket = io();
    
    // Entrar na sala da conversa para receber atualizações
    socket.emit('join_conversation', conversationId);
    
    // Escutar eventos de atualização de mensagens
    socket.on('broadcast_message', (data) => {
      console.log('📨 Evento em tempo real recebido:', data);
      
      if (data.type === 'message_updated' && data.conversationId === conversationId) {
        // Invalidar cache para recarregar mensagens com dados atualizados
        queryClient.invalidateQueries({
          queryKey: ['/api/conversations', conversationId, 'messages']
        });
      }
    });

    return () => {
      socket.off('broadcast_message');
      socket.emit('leave_conversation', conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  // Calcular altura do container dinamicamente
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setContainerHeight(height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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

  if ((messages as Message[]).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm mt-1">Comece uma conversa!</p>
        </div>
      </div>
    );
  }

  // Criar contato padrão se não fornecido
  const defaultContact: Contact = contact || {
    id: 0,
    name: 'Contato',
    phone: null,
    email: null,
    profileImageUrl: null,
    location: null,
    age: null,
    isOnline: null,
    lastSeenAt: null,
    createdAt: null,
    updatedAt: null
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col">
      <VirtualizedMessageList
        messages={messages as Message[]}
        contact={defaultContact}
        conversationId={conversationId}
        height={containerHeight}
      />
    </div>
  );
}