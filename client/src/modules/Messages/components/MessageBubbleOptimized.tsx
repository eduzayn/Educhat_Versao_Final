import { memo, useMemo, useState, useRef } from "react";
import { Check, CheckCheck, Play, Pause, Volume2, StickyNote } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/ui/avatar";
import { Button } from "@/shared/ui/ui/button";
import { format } from "date-fns";
import type { Message, Contact } from "@shared/schema";
import { AudioMessage } from "./AudioMessage";
import { LazyMediaContent } from "./LazyMediaContent";
import { secureLog } from "@/lib/secureLogger";

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

export const MessageBubbleOptimized = memo(function MessageBubble({
  message,
  contact,
  channelIcon,
  channelColor,
  conversationId,
}: MessageBubbleProps) {
  const isFromContact = message.isFromContact;

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

    // Para outros tipos de mídia, usar LazyMediaContent
    if (message.messageType && ['image', 'video', 'document'].includes(message.messageType as string)) {
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
    <div className={containerClasses}>
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
        </div>
      </div>
    </div>
  );
});
