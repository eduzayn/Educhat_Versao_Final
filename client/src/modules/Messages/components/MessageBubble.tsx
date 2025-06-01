import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Message, Contact } from '@shared/schema';

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
    <div className={`flex items-start gap-3 mb-4 ${isFromContact ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage 
          src={isFromContact ? contact.profileImageUrl || '' : ''} 
          alt={isFromContact ? contact.name : 'Agente'} 
        />
        <AvatarFallback className="text-xs">
          {isFromContact 
            ? contact.name?.charAt(0)?.toUpperCase() || 'C'
            : 'A'
          }
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-md ${isFromContact ? '' : 'flex flex-col items-end'}`}>
        <div className={`px-4 py-2 rounded-lg ${
          isFromContact 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-blue-600 text-white'
        }`}>
          <p className="text-sm">{message.content}</p>
        </div>
        
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isFromContact ? '' : 'justify-end'}`}>
          {!isFromContact && (
            <div className="flex items-center">
              {message.readAt ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : message.deliveredAt ? (
                <CheckCheck className="w-3 h-3 text-gray-400" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              )}
            </div>
          )}
          <span>{messageTime}</span>
        </div>
      </div>
    </div>
  );
}