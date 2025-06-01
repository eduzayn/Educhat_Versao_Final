import { Check, CheckCheck, Play, Pause, Volume2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef } from 'react';
import { MessageReactions } from './MessageReactions';
import type { Message, Contact } from '@shared/schema';

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
}

// Componente para reproduzir mensagem de áudio
function AudioMessage({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extrair informações do áudio dos metadados
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const audioSize = 'audioSize' in metadata ? metadata.audioSize as number : null;
  const audioDuration = 'duration' in metadata ? metadata.duration as number : null;

  const sizeText = audioSize ? ` (${Math.round(audioSize / 1024)}KB)` : '';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Usar duração dos metadados se disponível
  const effectiveDuration = audioDuration || duration;

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Criar URL do áudio se estiver disponível no conteúdo
  const audioUrl = message.content?.startsWith('data:audio/') ? message.content : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    }`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
      
      <button
        onClick={togglePlayback}
        disabled={!audioUrl}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isFromContact 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-blue-600 hover:bg-gray-100'
        } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1">
        <div className={`flex items-center gap-2 ${isFromContact ? 'text-gray-700' : 'text-white'}`}>
          <span className="text-sm font-medium">
            {audioUrl ? 'Mensagem de áudio' : 'Mensagem de áudio (não disponível)'}
            {sizeText}
          </span>
          {effectiveDuration > 0 && (
            <span className="text-xs opacity-75">
              {formatTime(currentTime)} / {formatTime(effectiveDuration)}
            </span>
          )}
        </div>
        <div className={`text-xs ${isFromContact ? 'text-gray-500' : 'text-blue-100'}`}>
          Enviado via WhatsApp
        </div>
        {effectiveDuration > 0 && (
          <div className={`w-full h-1 mt-2 rounded overflow-hidden ${
            isFromContact ? 'bg-gray-300' : 'bg-blue-400'
          }`}>
            <div 
              className={`h-full transition-all duration-100 ${
                isFromContact ? 'bg-blue-600' : 'bg-white'
              }`}
              style={{ width: `${(currentTime / effectiveDuration) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageBubble({ message, contact, channelIcon, channelColor, conversationId }: MessageBubbleProps) {
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
            <AudioMessage message={message} isFromContact={isFromContact} />
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isFromContact ? '' : 'justify-end'}`}>
          {/* Reações disponíveis apenas para mensagens do contato (WhatsApp) */}
          {isFromContact && contact.phone && conversationId && (
            <MessageReactions 
              message={message}
              conversationId={conversationId}
              contactPhone={contact.phone}
            />
          )}
          
          <div className="flex items-center gap-1">
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
    </div>
  );
}