import { ConversationListVirtualized } from './ConversationListVirtualized';
import { useInfiniteConversations } from '@/shared/lib/hooks/useInfiniteConversations';
import { useState } from 'react';

interface SidebarConversationsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
}

export function SidebarConversations({ 
  searchTerm, 
  onSearchChange, 
  activeConversationId, 
  onConversationSelect 
}: SidebarConversationsProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  const { 
    data, 
    isLoading, 
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteConversations(50);

  const conversations = data?.pages.flatMap(page => page.conversations) || [];
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Lista de conversas com scroll infinito */}
      <ConversationListVirtualized
        conversations={conversations}
        isLoading={isLoading || isFetchingNextPage}
        hasNextPage={hasNextPage || false}
        searchTerm={searchTerm}
        setSearchTerm={onSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        activeConversation={activeConversation}
        onSelectConversation={(conversation) => onConversationSelect(conversation.id)}
        onLoadMore={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        channels={[]}
      />
    </div>
  );
}