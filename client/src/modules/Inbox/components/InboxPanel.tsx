import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/ui/input';
import { Button } from '@/shared/ui/ui/button';
import { ConversationList } from './ConversationList';
import { useConversations } from '../hooks/useInbox';
import { CHANNELS } from '../types/inbox.types';
import { cn } from '@/lib/utils';

export function InboxPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  
  const { data: conversations = [], isLoading } = useConversations();

  // Filter conversations based on search and channel
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.messages[0]?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = selectedChannel === 'all' || conv.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

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
            className="pl-10 focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary"
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
              selectedChannel === 'all' && "bg-educhat-primary text-white hover:bg-educhat-secondary"
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
                selectedChannel === key && "bg-educhat-primary text-white hover:bg-educhat-secondary"
              )}
            >
              <i className={`${channel.icon} mr-1`} />
              {channel.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <ConversationList conversations={filteredConversations} />
    </div>
  );
}