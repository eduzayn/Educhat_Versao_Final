import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Search, Filter, X } from 'lucide-react';
import { STATUS_CONFIG, type ConversationStatus } from '@/types/chat';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationListProps {
  conversations: ConversationWithContact[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  activeConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar conversas
  const filteredConversations = conversations?.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.contact?.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  }) || [];

  const getChannelIcon = (channel: string) => {
    // Channel icons now handled by backend data
    return '💬';
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
                {/* Channels loaded dynamically from API */}
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

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
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
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
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
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-xs">
                      {getChannelIcon(conversation.channel)}
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

                    {/* Status e última mensagem */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(conversation.status || 'open')}
                        {(conversation.unreadCount || 0) > 0 && (
                          <Badge className="bg-gray-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
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
                          {(() => {
                            const lastMessage = conversation.messages[0];
                            
                            // Para mensagens de texto, sempre mostrar o conteúdo real
                            if (lastMessage.messageType === 'text' && lastMessage.content) {
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
                              const fileName = (lastMessage.metadata as any)?.document?.fileName;
                              if (fileName) {
                                return `📄 ${fileName}`;
                              }
                              return '📄 Documento';
                            }
                            
                            // Fallback
                            return lastMessage.content || 'Mensagem';
                          })()}
                        </>
                      ) : (
                        'Sem mensagens'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}