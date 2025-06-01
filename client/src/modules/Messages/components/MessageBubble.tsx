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

// Componente para player de áudio
function AudioPlayer({ message, isFromContact }: { message: Message; isFromContact: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extrair tamanho do áudio dos metadados se disponível
  const audioSize = message.metadata && typeof message.metadata === 'object' && 'audioSize' in message.metadata 
    ? message.metadata.audioSize as number 
    : null;

  const sizeText = audioSize ? `(${Math.round(audioSize / 1024)}KB)` : '';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isFromContact ? 'bg-gray-100' : 'bg-blue-600'
    }`}>
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isFromContact 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-blue-600 hover:bg-gray-100'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      
      <div className="flex-1">
        <div className={`flex items-center gap-2 ${isFromContact ? 'text-gray-700' : 'text-white'}`}>
          <Volume2 className="w-4 h-4" />
          <span className="text-sm font-medium">Áudio {sizeText}</span>
        </div>
        <div className={`text-xs ${isFromContact ? 'text-gray-500' : 'text-blue-100'}`}>
          {currentTime > 0 ? formatTime(currentTime) : '0:00'} 
          {duration > 0 && ` / ${formatTime(duration)}`}
        </div>
      </div>
      
      {/* Audio element oculto - como não temos o arquivo de áudio real, apenas simulamos */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      >
        {/* Aqui normalmente teria a URL do arquivo de áudio */}
      </audio>
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