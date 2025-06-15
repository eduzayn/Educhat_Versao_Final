import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { ConversationListHeader } from './ConversationListHeader';
import { ConversationItem } from './ConversationItem';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationListVirtualizedProps {
  conversations: ConversationWithContact[];
  isLoading: boolean;
  hasNextPage: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  onLoadMore: () => void;
  channels: any[];
  onRefresh?: () => void;
  onNewContact?: () => void;
}

export function ConversationListVirtualized({
  conversations,
  isLoading,
  hasNextPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  activeConversation,
  onSelectConversation,
  onLoadMore,
  channels = [],
  onRefresh,
  onNewContact
}: ConversationListVirtualizedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(50);

  // Filtrar conversas de forma otimizada
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    return conversations.filter(conversation => {
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = conversation.contact?.name?.toLowerCase().includes(searchLower);
        const phoneMatch = conversation.contact?.phone?.includes(searchTerm);
        const emailMatch = conversation.contact?.email?.toLowerCase()?.includes(searchLower);
        
        if (!nameMatch && !phoneMatch && !emailMatch) {
          return false;
        }
      }
      
      // Filtro por status
      if (statusFilter !== 'all' && conversation.status !== statusFilter) {
        return false;
      }
      
      // Filtro por canal
      if (channelFilter !== 'all') {
        if (channelFilter.startsWith('whatsapp-')) {
          const specificChannelId = parseInt(channelFilter.replace('whatsapp-', ''));
          return conversation.channel === 'whatsapp' && conversation.channelId === specificChannelId;
        }
        return conversation.channel === channelFilter;
      }
      
      return true;
    });
  }, [conversations, searchTerm, statusFilter, channelFilter]);

  // Conversas visíveis (limitadas para performance)
  const visibleConversations = useMemo(() => {
    return filteredConversations.slice(0, displayCount);
  }, [filteredConversations, displayCount]);

  // Detectar scroll para carregar mais
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

    // Carregar mais itens da lista atual
    if (isNearBottom && displayCount < filteredConversations.length) {
      setDisplayCount(prev => Math.min(prev + 25, filteredConversations.length));
      return;
    }

    // Carregar próxima página se chegou ao fim e tem mais páginas
    if (isNearBottom && hasNextPage && !isLoading) {
      onLoadMore();
    }
  }, [displayCount, filteredConversations.length, hasNextPage, isLoading, onLoadMore]);

  // Throttle do scroll
  const throttledHandleScroll = useCallback(() => {
    requestAnimationFrame(handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', throttledHandleScroll);
    return () => container.removeEventListener('scroll', throttledHandleScroll);
  }, [throttledHandleScroll]);

  // Formatação de tempo otimizada
  const formatTime = useCallback((date: string | Date) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 dias
      return dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  }, []);

  // Extrair texto da última mensagem de forma otimizada
  const getLastMessageText = useCallback((conversation: ConversationWithContact) => {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return 'Sem mensagens';
    
    // Filtrar mensagens genéricas inadequadas
    const isGenericMessage = lastMessage.content && (
      lastMessage.content === 'Mensagem recebida' ||
      lastMessage.content === 'Mensagem não identificada' ||
      lastMessage.content === 'Mensagem em processamento'
    );
    
    // Extrair conteúdo real dos metadados se for mensagem genérica
    if (isGenericMessage && lastMessage.metadata) {
      const metadata = lastMessage.metadata as any;
      
      if (metadata.text?.message) {
        return metadata.text.message;
      }
      
      if (metadata.image) {
        const caption = metadata.image.caption;
        return caption?.trim() ? caption : '📷 Imagem';
      }
      
      if (metadata.audio) return '🎵 Áudio';
      if (metadata.video) {
        const caption = metadata.video.caption;
        return caption?.trim() ? caption : '🎥 Vídeo';
      }
      
      if (metadata.document) {
        const fileName = metadata.document.fileName || metadata.fileName;
        return fileName ? `📄 ${fileName}` : '📄 Documento';
      }
    }
    
    // Para mensagens de texto válidas
    if (lastMessage.messageType === 'text' && lastMessage.content && !isGenericMessage) {
      return lastMessage.content;
    }
    
    // Para outros tipos de mídia
    switch (lastMessage.messageType) {
      case 'image': {
        const caption = (lastMessage.metadata as any)?.image?.caption;
        return caption?.trim() ? caption : '📷 Imagem';
      }
      case 'audio':
        return '🎵 Áudio';
      case 'video': {
        const caption = (lastMessage.metadata as any)?.video?.caption;
        return caption?.trim() ? caption : '🎥 Vídeo';
      }
      case 'document': {
        const fileName = (lastMessage.metadata as any)?.document?.fileName || 
                        (lastMessage.metadata as any)?.fileName;
        return fileName ? `📄 ${fileName}` : '📄 Documento';
      }
      default:
        return lastMessage.content || 'Nova mensagem';
    }
  }, []);

  // Renderizar ícone do canal
  const renderChannelIcon = useCallback((channel: string) => {
    const iconClass = channel === 'whatsapp' ? 'text-green-600 bg-green-50' :
                     channel === 'instagram' ? 'text-pink-600 bg-pink-50' :
                     channel === 'facebook' ? 'text-blue-600 bg-blue-50' :
                     'text-gray-600 bg-gray-50';
    
    return (
      <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${iconClass}`}>
        <MessageSquare className="w-3 h-3" />
      </div>
    );
  }, []);

  // Componente de item da conversa
  const ConversationItem = useCallback(({ conversation, index }: { conversation: ConversationWithContact; index: number }) => {
    const isActive = activeConversation?.id === conversation.id;
    const unreadCount = conversation.unreadCount || 0;
    const proxiedImageUrl = useMediaUrl(conversation.contact?.profileImageUrl);
    
    return (
      <div
        key={conversation.id}
        onClick={() => onSelectConversation(conversation)}
        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
          isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar do contato */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={proxiedImageUrl || ''} 
                alt={conversation.contact?.name || 'Contato'} 
              />
              <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                {conversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            
            {/* Ícone de canal pequeno */}
            <div className="absolute -bottom-1 -right-1">
              {renderChannelIcon(conversation.channel)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Nome e timestamp */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {conversation.contact?.name || `+${conversation.contact?.phone}` || 'Contato sem nome'}
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
                </span>
                <ConversationActionsDropdown 
                  conversationId={conversation.id}
                  contactId={conversation.contactId}
                  currentStatus={conversation.status || 'open'}
                />
              </div>
            </div>

            {/* Badge de mensagens não lidas */}
            <div className="flex items-center justify-end mb-1">
              {unreadCount > 0 && (
                <Badge className="bg-blue-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>

            {/* Preview da última mensagem */}
            <p className="text-sm text-gray-500 truncate">
              {getLastMessageText(conversation)}
            </p>
          </div>
        </div>
      </div>
    );
  }, [activeConversation, onSelectConversation, formatTime, getLastMessageText, renderChannelIcon]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setChannelFilter('all');
  }, [setSearchTerm, setStatusFilter, setChannelFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header com botão Dashboard, título e ações */}
      <div className="p-4 border-b border-gray-200">
        {/* Cabeçalho principal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {onNewContact && (
              <Button variant="ghost" size="sm" onClick={onNewContact}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Busca */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-gray-50 border-gray-200' : ''}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="flex gap-2 text-sm">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                {channels.map(channel => (
                  <SelectItem key={channel.id} value={`whatsapp-${channel.id}`}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all' || channelFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lista com scroll infinito nativo */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ height: 'calc(100vh - 160px)' }}
      >
        {isLoading && filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando conversas...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleConversations.map((conversation, index) => (
              <ConversationItem 
                key={`conversation-${conversation.id}-${index}`}
                conversation={conversation}
                index={index}
              />
            ))}
            
            {/* Indicador de carregamento para mais conversas */}
            {(displayCount < filteredConversations.length || hasNextPage) && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Carregando mais conversas...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}