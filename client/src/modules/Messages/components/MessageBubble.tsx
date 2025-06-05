import { memo, useMemo, useState, useRef } from "react";
import { Check, CheckCheck, Play, Pause, Volume2, StickyNote, EyeOff, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/ui/avatar";
import { Button } from "@/shared/ui/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/shared/ui/ui/alert-dialog';
import { format } from "date-fns";
import type { Message, Contact } from "@shared/schema";
import { AudioMessage } from "./AudioMessage";
import { LazyMediaContent } from "./LazyMediaContent";
import { MessageReactions } from "./MessageReactions";
import { secureLog } from "@/lib/secureLogger";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/shared/lib/hooks/use-toast";

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
}

// Função auxiliar para formatar o horário
const formatTime = (timestamp: Date | string | number) =>
  format(new Date(timestamp), "HH:mm");

export const MessageBubble = memo(function MessageBubble({
  message,
  contact,
  channelIcon,
  channelColor,
  conversationId,
}: MessageBubbleProps) {
  const isFromContact = message.isFromContact;
  const { toast } = useToast();
  const [isHiding, setIsHiding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Função para ocultar mensagem localmente
  const handleHideMessage = async () => {
    try {
      setIsHiding(true);
      await apiRequest(`/api/messages/${message.id}/hide`, 'POST');
      
      // Invalidar cache das mensagens para atualizar a lista
      if (conversationId) {
        await queryClient.invalidateQueries({
          queryKey: ['/api/conversations', conversationId, 'messages']
        });
      }
      
      toast({
        title: "Mensagem ocultada",
        description: "A mensagem foi ocultada apenas para você.",
      });
    } catch (error) {
      console.error('Erro ao ocultar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ocultar a mensagem.",
        variant: "destructive"
      });
    } finally {
      setIsHiding(false);
    }
  };

  // Verificar se a mensagem pode ser deletada (dentro de 7 minutos para WhatsApp)
  const canDelete = () => {
    if (isFromContact) {
      console.log('🚫 Não pode deletar: mensagem do contato');
      return false; // Só permite deletar mensagens enviadas pelo agente
    }
    
    const messageDate = new Date(message.sentAt || new Date());
    const now = new Date();
    const timeDifference = now.getTime() - messageDate.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000; // 7 minutos em milissegundos
    
    const canDeleteMsg = timeDifference <= sevenMinutesInMs;
    
    console.log('🗑️ Debug canDelete:', {
      messageId: message.id,
      content: message.content?.substring(0, 20),
      isFromContact,
      sentAt: message.sentAt,
      messageDate: messageDate.toISOString(),
      now: now.toISOString(),
      timeDifference: Math.round(timeDifference / 1000) + 's',
      canDelete: canDeleteMsg,
      hasPhone: !!contact.phone,
      hasConversationId: !!conversationId,
      metadata: message.metadata
    });
    
    return canDeleteMsg;
  };

  const handleDeleteMessage = async () => {
    if (!contact.phone || !conversationId) return;

    // Extrair messageId dos metadados - tentar múltiplas possibilidades
    const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
    let messageId = null;
    
    // Buscar o ID da mensagem nos metadados em diferentes campos possíveis
    if ('messageId' in metadata && metadata.messageId) {
      messageId = metadata.messageId;
    } else if ('zaapId' in metadata && metadata.zaapId) {
      messageId = metadata.zaapId;
    } else if ('id' in metadata && metadata.id) {
      messageId = metadata.id;
    }

    // Log para debug
    console.log('🗑️ Tentando deletar mensagem:', {
      messageLocalId: message.id,
      messageId,
      metadata,
      phone: contact.phone,
      conversationId
    });

    if (!messageId) {
      toast({
        title: "Erro",
        description: "Esta mensagem não pode ser deletada (ID da Z-API não encontrado)",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest('POST', '/api/zapi/delete-message', {
        phone: contact.phone,
        messageId: messageId.toString(),
        conversationId: conversationId
      });

      console.log('✅ Resposta da exclusão:', response);

      // Marcar mensagem como deletada localmente e invalidar cache
      setIsDeleted(true);
      
      // Invalidar cache para recarregar mensagens com status atualizado
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${conversationId}/messages`] 
      });

      toast({
        title: "Sucesso",
        description: "Mensagem deletada com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      
      // Mostrar erro mais específico baseado na resposta
      let errorMessage = "Não foi possível deletar a mensagem";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const messageTimestamp = message.deliveredAt || message.sentAt || new Date();

  const messageTime = useMemo(
    () => formatTime(messageTimestamp),
    [messageTimestamp],
  );

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

  const avatarFallbackChar = isFromContact
    ? contact.name?.charAt(0)?.toUpperCase() || "C"
    : "A";

  const bubbleClasses = useMemo(() => {
    // Verificar se é uma nota interna
    const isInternalNote = message.isInternalNote;
    
    if (isInternalNote) {
      return "bg-amber-50 text-amber-900 border border-amber-200";
    }
    
    return isFromContact
      ? "bg-gray-100 text-gray-900"
      : "bg-blue-600 text-white";
  }, [isFromContact, message.isInternalNote]);

  const timeClasses = isFromContact
    ? "text-xs text-gray-400"
    : "text-xs text-gray-500 justify-end";

  const containerClasses = useMemo(() => {
    if (message.isInternalNote) {
      return "flex items-start gap-3 mb-4"; // Notas internas sempre alinhadas à esquerda
    }
    return `flex items-start gap-3 mb-4 ${isFromContact ? "" : "flex-row-reverse"}`;
  }, [isFromContact, message.isInternalNote]);

  const bubbleWrapperClasses = useMemo(() => {
    if (message.isInternalNote) {
      return "flex-1 max-w-md"; // Notas internas sempre alinhadas à esquerda
    }
    return `flex-1 max-w-md ${isFromContact ? "" : "flex flex-col items-end"}`;
  }, [isFromContact, message.isInternalNote]);

  // Mensagem deletada
  if (message.isDeleted) {
    return (
      <div className={containerClasses}>
        <Avatar className="w-8 h-8 flex-shrink-0 opacity-50">
          <AvatarImage
            src={isFromContact ? contact.profileImageUrl || "" : ""}
            alt={isFromContact ? contact.name : "Agente"}
          />
          <AvatarFallback className="text-xs">
            {avatarFallbackChar}
          </AvatarFallback>
        </Avatar>

        <div className={bubbleWrapperClasses}>
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 opacity-75">
            <span className="text-sm italic">Esta mensagem foi deletada</span>
          </div>
          <div className={`flex items-center gap-1 mt-1 ${timeClasses}`}>
            <span title={new Date(messageTimestamp).toLocaleString()}>
              {messageTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Função para renderizar o conteúdo da mensagem baseado no tipo
  const renderMessageContent = () => {
    if (message.messageType === 'audio') {
      secureLog.audio('Processando mensagem', message.id, (message.metadata as any)?.duration);

      // Verificar se temos uma URL válida para o áudio
      let audioUrl: string | null = null;
      
      // 1. Verificar se content é uma data URL válida
      if (message.content && message.content.startsWith('data:audio/')) {
        audioUrl = message.content;
      }
      // 2. Verificar se é apenas base64 e construir data URL
      else if (message.content && message.content.match(/^[A-Za-z0-9+/]+=*$/)) {
        const mimeType = (message.metadata as any)?.mimeType || 'audio/mp4';
        audioUrl = `data:${mimeType};base64,${message.content}`;
      }
      // 3. Verificar se é uma URL HTTP/HTTPS válida
      else if (message.content && (message.content.startsWith('http://') || message.content.startsWith('https://'))) {
        audioUrl = message.content;
      }
      // 4. Verificar se há audioUrl nos metadados (para mensagens recebidas)
      else if ((message.metadata as any)?.audio?.audioUrl) {
        audioUrl = (message.metadata as any).audio.audioUrl;
      }



      // Se não temos URL válida, tentar buscar usando messageId dos metadados
      if (!audioUrl) {
        const messageIdFromMetadata = (message.metadata as any)?.messageId;
        if (messageIdFromMetadata) {
          secureLog.debug('Buscando áudio via API', { messageId: messageIdFromMetadata });
          
          const duration = (message.metadata as any)?.duration || 0;
          return (
            <AudioMessage
              audioUrl={null}
              duration={duration}
              isFromContact={isFromContact}
              messageIdForFetch={messageIdFromMetadata}
            />
          );
        }
        
        // Se não tem messageId, mostrar fallback
        return (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <Volume2 className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">Áudio indisponível</span>
          </div>
        );
      }

      const duration = (message.metadata as any)?.duration || 0;
      return (
        <AudioMessage
          audioUrl={audioUrl}
          duration={duration}
          isFromContact={isFromContact}
        />
      );
    }

    // Para vídeos, verificar se há URL direta nos metadados primeiro
    if (message.messageType === 'video') {
      const metadata = message.metadata as any;
      let videoUrl: string | null = null;
      
      // 1. Verificar se há videoUrl nos metadados (mensagens do WhatsApp)
      if (metadata?.video?.videoUrl) {
        videoUrl = metadata.video.videoUrl;
      }
      // 2. Verificar se content é uma data URL válida
      else if (message.content && message.content.startsWith('data:video/')) {
        videoUrl = message.content;
      }
      // 3. Verificar se é uma URL HTTP/HTTPS válida
      else if (message.content && (message.content.startsWith('http://') || message.content.startsWith('https://'))) {
        videoUrl = message.content;
      }

      if (videoUrl) {
        return (
          <div className={`max-w-md rounded-lg overflow-hidden ${
            isFromContact ? 'bg-gray-100' : 'bg-blue-600'
          }`}>
            <video 
              src={videoUrl} 
              controls
              className="w-full h-auto max-h-96"
              preload="metadata"
              onError={(e) => secureLog.error('Erro ao carregar vídeo', { messageId: message.id, url: videoUrl })}
              onLoadedData={() => secureLog.debug('Vídeo carregado com sucesso', { messageId: message.id })}
            >
              Seu navegador não suporta a reprodução de vídeo.
            </video>
            {metadata?.video?.caption && (
              <div className={`px-3 py-2 text-xs ${
                isFromContact ? 'text-gray-600 bg-gray-50' : 'text-blue-100 bg-blue-700'
              }`}>
                {metadata.video.caption}
              </div>
            )}
          </div>
        );
      }
      
      // Fallback para LazyMediaContent se não há URL direta
      return (
        <LazyMediaContent
          messageId={message.id}
          messageType="video"
          conversationId={conversationId}
          isFromContact={isFromContact}
          metadata={metadata}
        />
      );
    }

    // Para outros tipos de mídia, usar LazyMediaContent
    if (message.messageType && ['image', 'document'].includes(message.messageType as string)) {
      return (
        <LazyMediaContent
          messageId={message.id}
          messageType={message.messageType as "audio" | "video" | "image" | "document"}
          conversationId={conversationId}
          isFromContact={isFromContact}
        />
      );
    }

    // Mensagem de texto padrão
    return (
      <div className={`px-4 py-2 rounded-lg ${bubbleClasses}`}>
        {message.isInternalNote && (
          <div className="mb-2 pb-2 border-b border-amber-300">
            <div className="flex items-center gap-2 mb-1">
              <StickyNote className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-800">Nota Interna</span>
              <span className="text-xs text-amber-700">•</span>
              <span className="text-xs text-amber-700">Visível apenas para a equipe</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <span className="font-medium">
                {message.authorName || 'Sistema'}
              </span>
              <span>•</span>
              <span>
                {message.sentAt ? new Date(message.sentAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : '--/--/----'}
              </span>
              <span>•</span>
              <span>
                {message.sentAt ? new Date(message.sentAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '--:--'}
              </span>
            </div>
          </div>
        )}
        {message.content ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="text-sm text-gray-500 italic">
            <p>Mensagem sem conteúdo de texto</p>
            {message.messageType && (
              <p className="text-xs mt-1">Tipo: {message.messageType}</p>
            )}

          </div>
        )}
      </div>
    );
  };

  // Mensagem normal
  return (
    <div className={`${containerClasses} group`}>
      {message.isInternalNote ? (
        <div className="w-8 h-8 flex-shrink-0 bg-gray-500 rounded-full flex items-center justify-center">
          <StickyNote className="w-4 h-4 text-gray-200" />
        </div>
      ) : (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage
            src={isFromContact ? contact.profileImageUrl || "" : ""}
            alt={isFromContact ? contact.name : "Agente"}
          />
          <AvatarFallback className="text-xs">
            {avatarFallbackChar}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={bubbleWrapperClasses}>
        {renderMessageContent()}

        <div className={`flex items-center gap-1 mt-1 ${timeClasses}`}>
          {messageStatus}
          <span title={new Date(messageTimestamp).toLocaleString()}>
            {messageTime}
          </span>
          
          {/* Reações de mensagem - apenas para mensagens do contato */}
          {isFromContact && !message.isInternalNote && contact.phone && conversationId && (
            <MessageReactions
              message={message}
              conversationId={conversationId}
              contactPhone={contact.phone}
            />
          )}
          {/* Botão de ocultar mensagem - apenas para mensagens recebidas */}
          {isFromContact && !message.isInternalNote && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              onClick={handleHideMessage}
              disabled={isHiding}
              title="Ocultar mensagem apenas para mim"
            >
              {isHiding ? (
                <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </Button>
          )}
          
          {/* Botão de deletar mensagem - apenas para mensagens enviadas pelo agente dentro de 7 minutos */}
          {!isFromContact && !message.isInternalNote && canDelete() && !isDeleted && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Excluir mensagem para todos"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir mensagem</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A mensagem será removida permanentemente do WhatsApp para todos os participantes da conversa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteMessage}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Excluindo...
                      </div>
                    ) : (
                      'Excluir para todos'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
});
