import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Badge } from '@/shared/ui/ui/badge';
import { useChatStore } from '@/shared/store/store/chatStore';
import { CHANNELS, STATUS_CONFIG } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ConversationWithContact } from '@/types/chat';

interface ConversationListProps {
  conversations: ConversationWithContact[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const { activeConversation, setActiveConversation, setMessages } = useChatStore();

  const handleConversationSelect = (conversation: ConversationWithContact) => {
    setActiveConversation(conversation);
    setMessages(conversation.id, conversation.messages);
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scroll-area">
        <div className="p-4 text-center">
          <p className="text-educhat-medium">No conversations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-area">
      {conversations.map((conversation) => {
        const isActive = activeConversation?.id === conversation.id;
        const channel = CHANNELS[conversation.channel];
        const status = STATUS_CONFIG[conversation.status as keyof typeof STATUS_CONFIG];
        const lastMessage = conversation.messages[0];
        const timeAgo = conversation.lastMessageAt ? 
          formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false }) : 
          '';

        return (
          <div
            key={conversation.id}
            onClick={() => handleConversationSelect(conversation)}
            className={cn(
              "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
              isActive && "bg-blue-50 border-l-4 border-l-educhat-blue"
            )}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={conversation.contact.profileImageUrl || ''} alt={conversation.contact.name} />
                <AvatarFallback>
                  {conversation.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-educhat-dark truncate">
                    {conversation.contact.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {channel && <i className={`${channel.icon} ${channel.color} text-xs`} />}
                    <span className="text-xs text-educhat-medium">{timeAgo}</span>
                  </div>
                </div>
                
                <p className="text-sm text-educhat-medium truncate">
                  {lastMessage?.content || 'No messages yet'}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      status?.color,
                      status?.bgColor
                    )}
                  >
                    {status?.label || conversation.status}
                  </Badge>
                  
                  {(conversation.unreadCount || 0) > 0 && (
                    <Badge className="bg-educhat-primary text-white text-xs px-2 py-1 rounded-full">
                      {conversation.unreadCount || 0}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}