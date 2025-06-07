import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Phone, Video, Info, MoreVertical, ArrowLeft } from 'lucide-react';
import { CHANNELS } from '@/types/chat';
import type { ConversationWithContact } from '@shared/schema';

interface ChatHeaderProps {
  conversation: ConversationWithContact;
  onBack?: () => void;
  showBackButton?: boolean;
  isOnline?: boolean;
}

export function ChatHeader({ 
  conversation, 
  onBack, 
  showBackButton = false, 
  isOnline = false 
}: ChatHeaderProps) {
  const getChannelIcon = (channel: string) => {
    const channelConfig = CHANNELS[channel];
    return channelConfig?.icon || '💬';
  };

  return (
    <div className="bg-red-100 border-b border-gray-200 p-4 flex items-center justify-between min-h-[80px] z-50 relative">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2"
            aria-label="Voltar para lista de conversas"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={conversation.contact?.profileImageUrl || ''} 
              alt={`Avatar de ${conversation.contact?.name || 'Contato'}`} 
            />
            <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
              {conversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          
          {/* Indicador de canal */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-xs">
            {getChannelIcon(conversation.channel)}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {conversation.contact?.name || `+${conversation.contact?.phone}` || 'Contato sem nome'}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {CHANNELS[conversation.channel]?.name || conversation.channel}
            </Badge>
            <span className="text-xs text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Ações do header */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          aria-label="Fazer chamada de voz"
        >
          <Phone className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          aria-label="Fazer chamada de vídeo"
        >
          <Video className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          aria-label="Informações do contato"
        >
          <Info className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          aria-label="Mais opções"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}