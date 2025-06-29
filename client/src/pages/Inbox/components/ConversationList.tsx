import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { SafeAvatar } from '@/components/SafeAvatar';
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

  const filteredConversations = conversations.filter((conversation) => {
    const matchSearch =
      !searchTerm ||
      conversation.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.contact?.phone?.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    return matchSearch && matchStatus && matchChannel;
  });

  const formatLastMessageTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    return diff < 24
      ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as ConversationStatus] || STATUS_CONFIG.open;
    return (
      <Badge variant="secondary" className={`text-xs ${config.bgColor} ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
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
                {/* canais dinamicamente se necessário */}
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

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhuma conversa encontrada</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation?.id === c.id ? 'bg-gray-50 border-r-2 border-gray-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <SafeAvatar
                    src={c.contact?.profileImageUrl}
                    alt={c.contact?.name || 'Contato'}
                    fallbackText={c.contact?.name || 'C'}
                    className="w-12 h-12"
                    fallbackClassName="bg-gray-100 text-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {c.contact?.name || `+${c.contact?.phone}` || 'Contato sem nome'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatLastMessageTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(c.status || 'open')}
                        {(c.unreadCount || 0) > 0 && (
                          <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
                            {(c.unreadCount || 0) > 99 ? '99+' : c.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {c.messages?.[0]?.content || 'Sem mensagens'}
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