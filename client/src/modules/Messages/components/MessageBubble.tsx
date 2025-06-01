import { Check, CheckCheck, Play, Pause, Volume2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef } from 'react';
import type { Message, Contact } from '@shared/schema';

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
}

// Componente simplificado para mostrar mensagem de áudio
function AudioMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  // Extrair tamanho do áudio dos metadados se disponível
  const audioSize = message.metadata && typeof message.metadata === 'object' && 'audioSize' in message.metadata 
    ? message.metadata.audioSize as number 
    : null;

  const sizeText = audioSize ? ` (${Math.round(audioSize / 1024)}KB)` : '';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isFromContact 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-blue-600'
      }`}>
        <Volume2 className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <div className={`flex items-center gap-2 ${isFromContact ? 'text-gray-700' : 'text-white'}`}>
          <span className="text-sm font-medium">Mensagem de áudio{sizeText}</span>
        </div>
        <div className={`text-xs ${isFromContact ? 'text-gray-500' : 'text-blue-100'}`}>
          Enviado via WhatsApp
        </div>
      </div>
    </div>
  );
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
        <div className={`${
          message.messageType === 'audio' ? '' : 'px-4 py-2'
        } rounded-lg ${
          isFromContact 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-blue-600 text-white'
        }`}>
          {message.messageType === 'audio' ? (
            <AudioPlayer message={message} isFromContact={isFromContact} />
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
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