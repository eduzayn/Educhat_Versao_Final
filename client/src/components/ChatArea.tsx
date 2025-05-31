import { MessagesArea } from './MessagesArea';
import { MessageInput } from './MessageInput';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/store/chatStore';
import { CHANNELS } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

export function ChatArea() {
  const { activeConversation, isConnected } = useChatStore();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-educhat-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-comments text-educhat-blue text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-educhat-dark mb-2">Welcome to EduChat</h3>
          <p className="text-educhat-medium">Select a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  const { contact } = activeConversation;
  const channel = CHANNELS[activeConversation.channel];
  const lastSeen = contact.lastSeenAt 
    ? formatDistanceToNow(new Date(contact.lastSeenAt), { addSuffix: true })
    : 'Never';

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={contact.profileImageUrl || ''} alt={contact.name} />
              <AvatarFallback>
                {contact.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-lg font-semibold text-educhat-dark">{contact.name}</h2>
              <div className="flex items-center space-x-2">
                {channel && <i className={`${channel.icon} ${channel.color}`} />}
                <span className="text-sm text-educhat-medium">
                  {channel?.name} • {contact.isOnline ? 'Online' : `Last seen ${lastSeen}`}
                </span>
                <span className={`w-2 h-2 rounded-full ${contact.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue hover:bg-gray-100 rounded-lg">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue hover:bg-gray-100 rounded-lg">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Warning */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-700">Reconnecting to EduChat...</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <MessagesArea />

      {/* Message Input */}
      <MessageInput />
    </div>
  );
}
