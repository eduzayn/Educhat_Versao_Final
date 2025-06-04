import { memo, useMemo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { format } from 'date-fns';
import type { Message, Contact } from '@shared/schema';

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
}

// Componente otimizado com memo para evitar re-renderizações desnecessárias
export const MessageBubbleOptimized = memo(function MessageBubble({ 
  message, 
  contact, 
  channelIcon, 
  channelColor, 
  conversationId 
}: MessageBubbleProps) {
  const isFromContact = message.isFromContact;
  
  // Memoizar cálculos custosos
  const messageTime = useMemo(() => {
    const messageTimestamp = message.deliveredAt || message.sentAt || new Date();
    return format(new Date(messageTimestamp), 'HH:mm');
  }, [message.deliveredAt, message.sentAt]);

  const messageStatus = useMemo(() => {
    if (isFromContact) return null;
    
    if (message.readAt) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else if (message.deliveredAt) {
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    } else {
      return <Check className="w-3 h-3 text-gray-400" />;
    }
  }, [isFromContact, message.readAt, message.deliveredAt]);

  // Se a mensagem foi deletada, mostrar interface simplificada
  if (message.isDeleted) {
    return (
      <div className={`flex items-start gap-3 mb-4 ${isFromContact ? '' : 'flex-row-reverse'}`}>
        <Avatar className="w-8 h-8 flex-shrink-0 opacity-50">
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
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 opacity-75">
            <span className="text-sm italic">Esta mensagem foi deletada</span>
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isFromContact ? '' : 'justify-end'}`}>
            <span>{messageTime}</span>
          </div>
        </div>
      </div>
    );
  }

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
          {messageStatus}
          <span>{messageTime}</span>
        </div>
      </div>
    </div>
  );
});