import { memo, useMemo, useState, useRef } from "react";
import { Check, CheckCheck, Play, Pause, Volume2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/ui/avatar";
import { Button } from "@/shared/ui/ui/button";
import { format } from "date-fns";
import type { Message, Contact } from "@shared/schema";
import { AudioMessage } from "./AudioMessage";
import { LazyMediaContent } from "./LazyMediaContent";

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

  const bubbleClasses = isFromContact
    ? "bg-gray-100 text-gray-900"
    : "bg-blue-600 text-white";

  const timeClasses = isFromContact
    ? "text-xs text-gray-400"
    : "text-xs text-gray-500 justify-end";

  const containerClasses = `flex items-start gap-3 mb-4 ${isFromContact ? "" : "flex-row-reverse"}`;

  const bubbleWrapperClasses = `flex-1 max-w-md ${isFromContact ? "" : "flex flex-col items-end"}`;

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
      console.log('🎧 Processando mensagem de áudio:', {
        messageId: message.id,
        content: message.content,
        metadata: message.metadata
      });

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

      console.log('🎧 URL do áudio processada:', audioUrl);

      // Se não temos URL válida, tentar buscar usando messageId dos metadados
      if (!audioUrl) {
        const messageIdFromMetadata = (message.metadata as any)?.messageId;
        if (messageIdFromMetadata) {
          console.log('🔄 Tentando buscar áudio via API com messageId:', messageIdFromMetadata);
          
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
        <p className="text-sm">{message.content}</p>
      </div>
    );
  };

  // Mensagem normal
  return (
    <div className={containerClasses}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage
          src={isFromContact ? contact.profileImageUrl || "" : ""}
          alt={isFromContact ? contact.name : "Agente"}
        />
        <AvatarFallback className="text-xs">
          {avatarFallbackChar}
        </AvatarFallback>
      </Avatar>

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
