import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Phone, Video, Info, MoreVertical, ArrowLeft, Users, User } from 'lucide-react';
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
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Linha principal com avatar, nome e ações */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-600">Ativa</span>
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

      {/* Linha com Status e Equipe */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <Select defaultValue="equipe-comercial">
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 hover:bg-gray-50 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipe-comercial">Equipe Comercial</SelectItem>
              <SelectItem value="equipe-suporte">Equipe Suporte</SelectItem>
              <SelectItem value="equipe-financeiro">Equipe Financeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <Select defaultValue="nao-atribuido">
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 hover:bg-gray-50 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao-atribuido">Não atribuído</SelectItem>
              <SelectItem value="usuario1">João Silva</SelectItem>
              <SelectItem value="usuario2">Maria Santos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}