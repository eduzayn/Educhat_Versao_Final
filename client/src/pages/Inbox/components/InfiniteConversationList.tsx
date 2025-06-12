import { useState, useRef, useCallback } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, X, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useInfiniteConversations } from '@/shared/lib/hooks/useInfiniteConversations';
import type { ConversationWithContact } from '@shared/schema';

interface InfiniteConversationListProps {
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  searchTerm?: string;
  statusFilter?: string;
  channelFilter?: string;
}

const STATUS_CONFIG = {
  open: { label: 'Aberta', color: 'text-green-700', bgColor: 'bg-green-100' },
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  closed: { label: 'Fechada', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'Em Andamento', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  resolved: { label: 'Resolvida', color: 'text-green-700', bgColor: 'bg-green-100' },
} as const;

type ConversationStatus = keyof typeof STATUS_CONFIG;

export function InfiniteConversationList({
  activeConversation,
  onSelectConversation,
  searchTerm = '',
  statusFilter = 'all',
  channelFilter = 'all',
}: InfiniteConversationListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteConversations(50);

  const observer = useRef<IntersectionObserver>();
  const lastConversationElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, fetchNextPage]);

  // Flatten all pages into a single array
  const allConversations = data?.pages.flatMap(page => page.conversations) || [];

  // Apply filters
  const filteredConversations = allConversations.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.contact?.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const renderChannelIcon = (channel: string) => {
    const getChannelColor = (ch: string) => {
      switch (ch) {
        case 'whatsapp': return 'bg-green-500 text-white';
        case 'instagram': return 'bg-pink-500 text-white';
        case 'facebook': return 'bg-blue-500 text-white';
        case 'email': return 'bg-gray-500 text-white';
        default: return 'bg-gray-400 text-white';
      }
    };

    const getChannelLabel = (ch: string) => {
      switch (ch) {
        case 'whatsapp': return 'WA';
        case 'instagram': return 'IG';
        case 'facebook': return 'FB';
        case 'email': return '@';
        default: return '?';
      }
    };

    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getChannelColor(channel)}`}>
        {getChannelLabel(channel)}
      </div>
    );
  };

  const formatMessagePreview = (conversation: ConversationWithContact) => {
    if (!conversation.lastMessage) return 'Sem mensagens';
    
    const message = conversation.lastMessage;
    if (message.type === 'text') {
      return message.content?.substring(0, 50) + (message.content && message.content.length > 50 ? '...' : '');
    } else if (message.type === 'image') {
      return '📷 Imagem';
    } else if (message.type === 'audio') {
      return '🎵 Áudio';
    } else if (message.type === 'document') {
      return '📄 Documento';
    }
    return 'Mensagem';
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-educhat-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <p>Erro ao carregar conversas: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm">Tente ajustar os filtros ou aguarde novas mensagens</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation, index) => {
              const isLast = index === filteredConversations.length - 1;
              const isActive = activeConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  ref={isLast ? lastConversationElementRef : null}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    isActive ? 'bg-educhat-primary bg-opacity-10 border-l-4 border-l-educhat-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={conversation.contact?.profileImageUrl || undefined} 
                          alt={conversation.contact?.name || 'Contato'} 
                        />
                        <AvatarFallback>
                          {conversation.contact?.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.contact?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contact?.name || conversation.contact?.phone || 'Contato desconhecido'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {renderChannelIcon(conversation.channel)}
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatRelative(new Date(conversation.lastMessage.createdAt), new Date(), { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {formatMessagePreview(conversation)}
                        </p>
                        <div className="flex items-center space-x-2 ml-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${STATUS_CONFIG[conversation.status as ConversationStatus]?.bgColor} ${STATUS_CONFIG[conversation.status as ConversationStatus]?.color}`}
                          >
                            {STATUS_CONFIG[conversation.status as ConversationStatus]?.label || conversation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-educhat-primary"></div>
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasNextPage && filteredConversations.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Todas as conversas foram carregadas
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}