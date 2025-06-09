import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { ConversationActionsDropdown } from './ConversationActionsDropdown';

interface ConversationItemProps {
  conversation: any;
  index: number;
  isActive: boolean;
  onSelect: (conversation: any) => void;
  formatTime: (date: string | Date) => string;
  getChannelStyle: (conversation: any) => string;
  getSpecificChannelName: (conversation: any) => string;
}

export function ConversationItem({
  conversation,
  index,
  isActive,
  onSelect,
  formatTime,
  getChannelStyle,
  getSpecificChannelName
}: ConversationItemProps) {
  const lastMessage = conversation.messages[0];
  const unreadCount = conversation.unreadCount || 0;

  const getLastMessageText = () => {
    if (!lastMessage) return 'Sem mensagens';
    
    // Para mensagens de texto, sempre mostrar o conteúdo real
    if (lastMessage.messageType === 'text' && lastMessage.content) {
      return lastMessage.content;
    }
    
    // Para imagens, mostrar caption se existir, senão mostrar indicador
    if (lastMessage.messageType === 'image') {
      const caption = lastMessage.metadata?.image?.caption;
      if (caption && caption.trim()) {
        return caption;
      }
      return lastMessage.isFromContact ? '📷 Imagem recebida' : '📷 Imagem enviada';
    }
    
    // Para áudios, sempre mostrar indicador (não há texto)
    if (lastMessage.messageType === 'audio') {
      return lastMessage.isFromContact ? '🎵 Áudio recebido' : '🎵 Áudio enviado';
    }
    
    // Para vídeos, mostrar caption se existir, senão mostrar indicador
    if (lastMessage.messageType === 'video') {
      const caption = lastMessage.metadata?.video?.caption;
      if (caption && caption.trim()) {
        return caption;
      }
      return lastMessage.isFromContact ? '🎥 Vídeo recebido' : '🎥 Vídeo enviado';
    }
    
    // Para documentos, mostrar nome do arquivo se disponível
    if (lastMessage.messageType === 'document') {
      const fileName = lastMessage.metadata?.document?.fileName;
      if (fileName) {
        return `📄 ${fileName}`;
      }
      return lastMessage.isFromContact ? '📄 Documento recebido' : '📄 Documento enviado';
    }
    
    // Fallback: tentar mostrar o conteúdo se disponível
    return lastMessage.content || 'Mensagem sem conteúdo';
  };

  return (
    <div
      key={`conversation-${conversation.id}-${index}`}
      className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onSelect(conversation)}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.contact.profileImageUrl || ''} />
          <AvatarFallback className="text-sm font-medium">
            {conversation.contact.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">
              {conversation.contact.name}
            </h3>
            <div className="flex items-center space-x-1">
              {lastMessage && lastMessage.sentAt && (
                <span className="text-xs text-gray-400">
                  {formatTime(lastMessage.sentAt)}
                </span>
              )}
              {unreadCount > 0 && (
                <Badge className="bg-gray-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <ConversationActionsDropdown 
                conversationId={conversation.id}
                contactId={conversation.contactId}
                currentStatus={conversation.status || 'open'}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 truncate flex-1">
              {getLastMessageText()}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
              getChannelStyle(conversation)
            }`}>
              {getSpecificChannelName(conversation)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}