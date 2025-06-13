import { useState, useCallback, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Search, Filter, X, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useInfiniteConversations } from '@/shared/lib/hooks/useInfiniteConversations';
import type { ConversationWithContact } from '@shared/schema';

interface InfiniteConversationListProps {
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
}

const STATUS_CONFIG = {
  open: { label: 'Aberta', color: 'text-green-700', bgColor: 'bg-green-100' },
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  resolved: { label: 'Resolvida', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  closed: { label: 'Fechada', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'Em Andamento', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  new: { label: 'Nova', color: 'text-emerald-700', bgColor: 'bg-emerald-100' }
};

type ConversationStatus = keyof typeof STATUS_CONFIG;

export function InfiniteConversationList({
  activeConversation,
  onSelectConversation,
}: InfiniteConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
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
        case 'telegram': return 'bg-blue-400 text-white';
        case 'email': return 'bg-gray-500 text-white';
        default: return 'bg-gray-400 text-white';
      }
    };

    const getChannelIcon = (ch: string) => {
      switch (ch) {
        case 'whatsapp': return <MessageSquare className="w-3 h-3" />;
        case 'instagram': return <MessageSquare className="w-3 h-3" />;
        case 'facebook': return <MessageSquare className="w-3 h-3" />;
        case 'telegram': return <MessageSquare className="w-3 h-3" />;
        case 'email': return <MessageSquare className="w-3 h-3" />;
        default: return <MessageSquare className="w-3 h-3" />;
      }
    };

    return (
      <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${getChannelColor(channel)}`}>
        {getChannelIcon(channel)}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as ConversationStatus] || STATUS_CONFIG.open;
    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${config.bgColor} ${config.color}`}
      >
        {config.label}
      </Badge>
    );
  };

  const formatLastMessageTime = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 dias
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatMessagePreview = (conversation: ConversationWithContact) => {
    if (!conversation.messages?.[0]) return 'Sem mensagens';
    
    const lastMessage = conversation.messages[0];
    
    // Filtrar mensagens genéricas inadequadas primeiro
    const isGenericMessage = lastMessage.content && (
      lastMessage.content === 'Mensagem recebida' ||
      lastMessage.content === 'Mensagem não identificada' ||
      lastMessage.content === 'Mensagem em processamento'
    );
    
    // Se for mensagem genérica, tentar extrair conteúdo real dos metadados
    if (isGenericMessage && lastMessage.metadata) {
      const metadata = lastMessage.metadata as any;
      
      // Tentar extrair texto real dos metadados
      if (metadata.text && metadata.text.message) {
        return metadata.text.message;
      }
      
      // Para outros tipos de mídia, mostrar descrição apropriada
      if (metadata.image) {
        const caption = metadata.image.caption;
        return caption && caption.trim() ? caption : '📷 Imagem';
      }
      
      if (metadata.audio) {
        return '🎵 Áudio';
      }
      
      if (metadata.video) {
        const caption = metadata.video.caption;
        return caption && caption.trim() ? caption : '🎥 Vídeo';
      }
      
      if (metadata.document) {
        const fileName = metadata.document.fileName || metadata.fileName;
        return fileName ? `📄 ${fileName}` : '📄 Documento';
      }
    }
    
    // Para mensagens de texto válidas, sempre mostrar o conteúdo real
    if (lastMessage.messageType === 'text' && lastMessage.content && !isGenericMessage) {
      return lastMessage.content;
    }
    
    // Para imagens, mostrar caption se existir
    if (lastMessage.messageType === 'image') {
      const caption = (lastMessage.metadata as any)?.image?.caption;
      if (caption && caption.trim()) {
        return caption;
      }
      return '📷 Imagem';
    }
    
    // Para áudios
    if (lastMessage.messageType === 'audio') {
      return '🎵 Áudio';
    }
    
    // Para vídeos, mostrar caption se existir
    if (lastMessage.messageType === 'video') {
      const caption = (lastMessage.metadata as any)?.video?.caption;
      if (caption && caption.trim()) {
        return caption;
      }
      return '🎥 Vídeo';
    }
    
    // Para documentos
    if (lastMessage.messageType === 'document') {
      const fileName = (lastMessage.metadata as any)?.document?.fileName || (lastMessage.metadata as any)?.fileName;
      if (fileName) {
        return `📄 ${fileName}`;
      }
      return '📄 Documento';
    }
    
    // Fallback final - só usar se realmente não tiver conteúdo
    if (lastMessage.content && !isGenericMessage) {
      return lastMessage.content;
    }
    
    return 'Nova mensagem';
  };

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 text-center text-red-500">
          <p>Erro ao carregar conversas</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de busca e filtros */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou telefone..."
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
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all' || channelFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setChannelFilter('all');
                }}
                className="text-gray-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lista de conversas com scroll infinito */}
      <div className="flex-1 overflow-y-auto">
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
            {filteredConversations.map((conversation, index) => (
              <div
                key={conversation.id}
                ref={index === filteredConversations.length - 1 ? lastConversationElementRef : null}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation?.id === conversation.id ? 'bg-gray-50 border-r-2 border-gray-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar do contato */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={conversation.contact?.profileImageUrl || ''} 
                        alt={conversation.contact?.name || 'Contato'} 
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                        {conversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Indicador de canal */}
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
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatLastMessageTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    {/* Contador de mensagens não lidas */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(conversation.unreadCount || 0) > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                            {(conversation.unreadCount || 0) > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preview da última mensagem */}
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.messages?.[0] ? (
                        <>
                          {conversation.messages[0].isFromContact ? '' : 'Você: '}
                          {formatMessagePreview(conversation)}
                        </>
                      ) : (
                        'Sem mensagens'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator para próxima página */}
            {isFetchingNextPage && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Carregando mais conversas...</p>
              </div>
            )}
            
            {/* Indicador de fim da lista */}
            {!hasNextPage && allConversations.length > 0 && (
              <div className="p-4 text-center text-gray-400 text-xs">
                <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                <p>Todas as conversas foram carregadas</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}