import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useConversations } from '@/hooks/useConversations';
import { useChatStore } from '@/store/chatStore';
import { CHANNELS, STATUS_CONFIG } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  
  const { data: conversations = [], isLoading } = useConversations();
  const { activeConversation, setActiveConversation, setMessages } = useChatStore();

  // Filter conversations based on search and channel
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.messages[0]?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = selectedChannel === 'all' || conv.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  const handleConversationSelect = (conversation: typeof conversations[0]) => {
    setActiveConversation(conversation);
    setMessages(conversation.id, conversation.messages);
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-educhat-blue mx-auto"></div>
          <p className="text-sm text-educhat-medium mt-2">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-educhat-medium w-4 h-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Channel Filters */}
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={selectedChannel === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChannel('all')}
            className={cn(
              "text-xs rounded-full",
              selectedChannel === 'all' && "bg-educhat-blue text-white hover:bg-educhat-blue/90"
            )}
          >
            All
          </Button>
          {Object.entries(CHANNELS).map(([key, channel]) => (
            <Button
              key={key}
              variant={selectedChannel === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChannel(key)}
              className={cn(
                "text-xs rounded-full",
                selectedChannel === key && "bg-educhat-blue text-white hover:bg-educhat-blue/90"
              )}
            >
              <i className={`${channel.icon} mr-1`} />
              {channel.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scroll-area">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-educhat-medium">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
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
                      
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-educhat-blue text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
