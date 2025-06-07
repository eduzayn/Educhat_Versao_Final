import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Input } from '@/shared/ui/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Search, MessageSquare, User } from 'lucide-react';
import type { ConversationWithContact } from '@shared/schema';
import { formatTime } from '@/shared/lib/utils/formatters';

interface ConversationPanelSimpleProps {
  conversations: ConversationWithContact[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  refetch: () => void;
}

export function ConversationPanelSimple({
  conversations,
  isLoading,
  searchTerm,
  setSearchTerm,
  activeConversation,
  onSelectConversation,
  refetch,
}: ConversationPanelSimpleProps) {
  // Filtrar conversas
  const filteredConversations = conversations?.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.contact?.phone?.includes(searchTerm);
    return matchesSearch;
  }) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredConversations.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-2"
          >
            Atualizar
          </Button>
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
              {searchTerm ? 'Tente ajustar a busca' : 'Aguardando novas mensagens'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation?.id === conversation.id;
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
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                      📱
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
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        Última mensagem...
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