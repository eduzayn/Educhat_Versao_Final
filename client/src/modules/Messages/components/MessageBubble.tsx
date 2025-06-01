import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Message, Contact } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
}

export function MessageBubble({ message, contact, channelIcon, channelColor }: MessageBubbleProps) {
  const isFromContact = message.isFromContact;
  const messageTime = formatDistanceToNow(new Date(message.sentAt || new Date()), { addSuffix: false });

  return (
    <div className={`flex items-start space-x-3 ${isFromContact ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <Avatar className="w-8 h-8">
        <AvatarImage 
          src={isFromContact ? contact.profileImageUrl || '' : ''} 
          alt={isFromContact ? contact.name : 'Agent'} 
        />
        <AvatarFallback>
          {isFromContact 
            ? contact.name.substring(0, 2).toUpperCase()
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
          {isFromContact && channelIcon && (
            <i className={`${channelIcon} ${channelColor} text-xs`} />
          )}
        </div>
      </div>
    </div>
  );
}