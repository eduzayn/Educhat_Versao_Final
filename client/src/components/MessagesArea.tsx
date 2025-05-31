import { useEffect, useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useChatStore } from '@/store/chatStore';
import { useMessages } from '@/hooks/useMessages';
import { CHANNELS } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

export function MessagesArea() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeConversation, messages, typingIndicators } = useChatStore();
  const conversationId = activeConversation?.id || null;
  
  const { data: fetchedMessages = [] } = useMessages(conversationId);
  
  // Use messages from store if available, otherwise use fetched messages
  const conversationMessages = conversationId && messages[conversationId] 
    ? messages[conversationId] 
    : fetchedMessages;

  const typingIndicator = conversationId ? typingIndicators[conversationId] : null;
  const channel = activeConversation ? CHANNELS[activeConversation.channel] : null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages, typingIndicator]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-educhat-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-comments text-educhat-blue text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-educhat-dark mb-2">Select a conversation</h3>
          <p className="text-educhat-medium">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-area bg-gray-50">
      {conversationMessages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-educhat-medium">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        conversationMessages.map((message) => {
          const isFromContact = message.isFromContact;
          const messageTime = formatDistanceToNow(new Date(message.sentAt || new Date()), { addSuffix: false });
          
          return (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${isFromContact ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={isFromContact ? activeConversation.contact.profileImageUrl || '' : ''} 
                  alt={isFromContact ? activeConversation.contact.name : 'Agent'} 
                />
                <AvatarFallback>
                  {isFromContact 
                    ? activeConversation.contact.name.substring(0, 2).toUpperCase()
                    : 'A'
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 max-w-md">
                <div className={`px-4 py-3 rounded-2xl ${
                  isFromContact 
                    ? 'bg-white border border-gray-200 rounded-bl-sm' 
                    : 'bg-educhat-blue text-white rounded-br-sm ml-auto'
                }`}>
                  <p className={isFromContact ? 'text-educhat-dark' : 'text-white'}>
                    {message.content}
                  </p>
                </div>
                
                <div className={`flex items-center space-x-2 mt-1 ${isFromContact ? '' : 'justify-end'}`}>
                  {!isFromContact && (
                    <div className="flex items-center space-x-1">
                      {message.readAt ? (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      ) : message.deliveredAt ? (
                        <CheckCheck className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Check className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  )}
                  <span className="text-xs text-educhat-medium">{messageTime}</span>
                  {isFromContact && channel && (
                    <i className={`${channel.icon} ${channel.color} text-xs`} />
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Typing Indicator */}
      {typingIndicator?.isTyping && (
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt="Agent" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-educhat-medium rounded-full typing-dot"></div>
              <div className="w-2 h-2 bg-educhat-medium rounded-full typing-dot"></div>
              <div className="w-2 h-2 bg-educhat-medium rounded-full typing-dot"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
