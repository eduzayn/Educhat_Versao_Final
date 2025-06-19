import { memo } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ConversationActionsDropdown } from '../ConversationActions';
import { ChannelIcon } from '../ChannelIcon';
import { STATUS_CONFIG, type ConversationStatus } from '@/types/chat';
import type { ConversationWithContact } from '@shared/schema';
import { useMediaUrl } from '@/shared/lib/utils/whatsappProxy';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: ConversationWithContact;
  isActive: boolean;
  onClick: (conversation: ConversationWithContact) => void;
}

function ConversationItemComponent({
  conversation,
  isActive,
  onClick
}: ConversationItemProps) {
  const mediaUrl = useMediaUrl(conversation.contact.profileImageUrl);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-orange-500" />;
      case 'closed':
      case 'resolved':
        return <AlertCircle className="w-3 h-3 text-gray-500" />;
      default:
        return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as ConversationStatus] || STATUS_CONFIG.open;
  };

  const formatLastMessageTime = (dateString: string | null | Date) => {
    if (!dateString) return '';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'agora' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1d' : `${diffInDays}d`;
    }
  };

  const lastMessage = conversation.messages?.[0];
  const statusConfig = getStatusConfig(conversation.status || 'open');
  const hasUnreadMessages = (conversation.unreadCount || 0) > 0;

  return (
    <div
      onClick={() => onClick(conversation)}
      className={cn(
        "flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative group",
        isActive && "bg-blue-50 border-l-4 border-l-educhat-primary"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Conversa com ${conversation.contact.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(conversation);
        }
      }}
    >
      {/* Avatar do contato */}
      <div className="relative mr-3 flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage 
            src={mediaUrl || undefined} 
            alt={conversation.contact.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-educhat-light text-educhat-medium font-medium">
            {conversation.contact.name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        {/* Ícone do canal */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
          <ChannelIcon 
            channel={conversation.channel} 
            className="w-3 h-3"
          />
        </div>
      </div>

      {/* Conteúdo da conversa */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <h3 className={cn(
              "font-medium text-gray-900 truncate",
              hasUnreadMessages && "font-semibold"
            )}>
              {conversation.contact.name}
            </h3>
            
            {/* Status da conversa */}
            {getStatusIcon(conversation.status || 'open')}
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-2 py-0.5",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Hora da última mensagem */}
          <div className="text-xs text-gray-500">
            {lastMessage && formatLastMessageTime(lastMessage.sentAt)}
          </div>
        </div>

        {/* Última mensagem */}
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm text-gray-600 truncate",
            hasUnreadMessages && "font-medium text-gray-800"
          )}>
            {lastMessage?.content || 'Sem mensagens'}
          </p>

          <div className="flex items-center space-x-2 ml-2">
            {/* Contador de mensagens não lidas */}
            {hasUnreadMessages && (
              <Badge className="bg-educhat-primary text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {(conversation.unreadCount || 0) > 99 ? '99+' : (conversation.unreadCount || 0)}
              </Badge>
            )}

            {/* Avatar do agente responsável */}
            {conversation.assignedUser && (
              <div className="flex-shrink-0" title={`Responsável: ${conversation.assignedUser.displayName}`}>
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={conversation.assignedUser.avatar || undefined} 
                    alt={conversation.assignedUser.displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                    {(() => {
                      const name = conversation.assignedUser.displayName || '';
                      const words = name.split(' ').filter(word => word.length > 0);
                      if (words.length >= 2) {
                        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
                      } else if (words.length === 1) {
                        return words[0].substring(0, 2).toUpperCase();
                      }
                      return '?';
                    })()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Menu de ações (visível no hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ConversationActionsDropdown
                conversationId={conversation.id}
                contactId={conversation.contact.id}
                currentStatus={conversation.status || 'open'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoização para otimizar performance
export const ConversationItem = memo(ConversationItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.conversation.status === nextProps.conversation.status &&
    (prevProps.conversation as any).unreadCount === (nextProps.conversation as any).unreadCount &&
    prevProps.conversation.messages?.[0]?.id === nextProps.conversation.messages?.[0]?.id &&
    // Verificar mudanças no assignedUser para garantir que avatar seja atualizado
    prevProps.conversation.assignedUserId === nextProps.conversation.assignedUserId &&
    prevProps.conversation.assignedUser?.id === nextProps.conversation.assignedUser?.id &&
    prevProps.conversation.assignedUser?.displayName === nextProps.conversation.assignedUser?.displayName
  );
});

export default ConversationItem;