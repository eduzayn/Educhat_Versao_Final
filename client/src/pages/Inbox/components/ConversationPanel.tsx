import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Search, Filter, X, MessageSquare, Clock, CheckCircle, AlertCircle, User, Plus } from 'lucide-react';
import { CHANNELS, STATUS_CONFIG, type ConversationStatus } from '@/types/chat';
import type { ConversationWithContact } from '@shared/schema';
import { formatTime } from '@/shared/lib/utils/formatters';

interface ConversationPanelProps {
  conversations: ConversationWithContact[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  canalOrigemFilter: string;
  setCanalOrigemFilter: (filter: string) => void;
  nomeCanalFilter: string;
  setNomeCanalFilter: (filter: string) => void;
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  channels?: any[];
  teams?: any[];
  refetch: () => void;
}

export function ConversationPanel({
  conversations,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  canalOrigemFilter,
  setCanalOrigemFilter,
  nomeCanalFilter,
  setNomeCanalFilter,
  activeConversation,
  onSelectConversation,
  channels = [],
  teams = [],
  refetch,
}: ConversationPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar conversas com lógica consolidada
  const filteredConversations = conversations?.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.contact?.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    const matchesCanalOrigem = canalOrigemFilter === 'all' || 
      (conversation.contact?.canalOrigem && conversation.contact.canalOrigem === canalOrigemFilter);
    const matchesNomeCanal = nomeCanalFilter === 'all' || 
      (conversation.contact?.nomeCanal && conversation.contact.nomeCanal === nomeCanalFilter);
    
    return matchesSearch && matchesStatus && matchesChannel && matchesCanalOrigem && matchesNomeCanal;
  }) || [];

  const getChannelInfo = (channel: string) => {
    const channelConfig = CHANNELS[channel as keyof typeof CHANNELS];
    return channelConfig || { icon: '📱', color: 'bg-gray-500', label: channel };
  };

  const getStatusConfig = (status: ConversationStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setChannelFilter('all');
    setCanalOrigemFilter('all');
    setNomeCanalFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || channelFilter !== 'all' || 
    canalOrigemFilter !== 'all' || nomeCanalFilter !== 'all';

  return (
    <div className="flex flex-col h-full">
      {/* Header consolidado */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredConversations.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="gap-2"
            >
              Atualizar
            </Button>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={canalOrigemFilter} onValueChange={setCanalOrigemFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Origens</SelectItem>
                  {teams.map((team: any) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={nomeCanalFilter} onValueChange={setNomeCanalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Nome Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Nomes</SelectItem>
                  {channels.map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.name}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma conversa encontrada</p>
            <p className="text-sm">
              {hasActiveFilters ? 'Tente ajustar os filtros' : 'Aguardando novas mensagens'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation?.id === conversation.id;
              const channelInfo = getChannelInfo(conversation.channel || 'whatsapp');
              const statusConfig = getStatusConfig(conversation.status as ConversationStatus);
              const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50
                    ${isActive ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.contact?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-sm">
                        {conversation.contact?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center ${channelInfo.color}`}
                    >
                      {channelInfo.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.contact?.name || conversation.contact?.phone || 'Contato'}
                      </h3>
                      <div className="flex items-center gap-1">
                        {hasUnread && (
                          <Badge variant="default" className="unread-badge text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {(conversation as any).lastMessageContent || 'Sem mensagens'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessageAt 
                          ? formatTime(new Date(conversation.lastMessageAt).getTime())
                          : conversation.createdAt ? formatTime(new Date(conversation.createdAt).getTime()) : ''
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}