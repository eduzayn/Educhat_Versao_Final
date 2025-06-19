import { useState, useRef, useMemo, useCallback, memo, forwardRef } from "react";
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  Volume2,
  Download,
  Trash2,
  StickyNote,
  Reply,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { MessageReactions } from "../MessageReactions/MessageReactions";
import { LazyMediaContent } from "../LazyMediaContent/LazyMediaContent";
import { AudioMessage } from "../AudioMessage/AudioMessage";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTime } from "@/shared/lib/utils/formatters";
import { useOptimizedDeletion } from "@/shared/lib/hooks/useOptimizedDeletion";
import { useIntersectionObserver } from "@/shared/lib/hooks/useIntersectionObserver";
import type { Message, Contact } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
  onReply?: (message: Message) => void;
  index?: number; // Para virtualização
  isVisible?: boolean; // Para virtualização
}

// Componente memoizado para evitar re-renders desnecessários
export const MessageBubble = memo(forwardRef<HTMLDivElement, MessageBubbleProps>(({
  message,
  contact,
  channelIcon,
  channelColor,
  conversationId,
  onReply,
  index,
  isVisible = true,
}, ref) => {
  const isFromContact = message.isFromContact;
  const [isDeleted, setIsDeleted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const { isDeleting, deleteMessage, canDelete } = useOptimizedDeletion(message.id, conversationId);

  // Intersection Observer para lazy loading
  const messageRef = useRef<HTMLDivElement>(null);
  useIntersectionObserver(messageRef, (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    });
  }, { threshold: 0.1, rootMargin: '100px' });

  // Memoização do timestamp para evitar recálculos
  const messageTimestamp = useMemo(() => 
    message.deliveredAt || message.sentAt || new Date(), 
    [message.deliveredAt, message.sentAt]
  );

  // Memoização do horário formatado
  const messageTime = useMemo(() => {
    const date = messageTimestamp instanceof Date
      ? messageTimestamp
      : new Date(messageTimestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [messageTimestamp]);

  // Memoização do status da mensagem
  const messageStatus = useMemo(() => {
    if (isFromContact) return null;
    
    // Status baseado no estado da mensagem
    if (message.status === 'sending') {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-yellow-600">Enviando...</span>
        </div>
      );
    }

    if (message.status === 'error') {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <span className="text-xs text-red-600">Erro ao enviar</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => message.tempId && retryMessage(message.tempId)}
            className="h-6 px-2 py-1 text-xs"
          >
            Tentar novamente
          </Button>
        </div>
      );
    }
    
    // Status de entrega/leitura
    if (message.readAt) return <CheckCheck className="w-3 h-3 text-blue-500" />;
    if (message.deliveredAt) return <CheckCheck className="w-3 h-3 text-gray-400" />;
    if (message.sentAt) return <Check className="w-3 h-3 text-gray-400" />;
    
    return null;
  }, [
    isFromContact,
    message.readAt,
    message.deliveredAt,
    message.sentAt,
    message.status,
    message.tempId
  ]);

  // Memoização do handler de delete
  const handleDeleteMessage = useCallback(async () => {
    const success = await deleteMessage(isFromContact, contact.phone, message.metadata);
    if (success) {
      setIsDeleted(true);
    }
  }, [deleteMessage, isFromContact, contact.phone, message.metadata]);

  // Memoização do handler de reply
  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(message);
    }
  }, [onReply, message]);

  // Memoização do avatar
  const avatarContent = useMemo(() => ({
    src: isFromContact ? contact.profileImageUrl || "" : "",
    fallback: isFromContact
      ? contact.name?.charAt(0)?.toUpperCase() || "C"
      : "A"
  }), [isFromContact, contact.profileImageUrl, contact.name]);

  // Renderização condicional para mensagens deletadas
  if (isDeleted || message.isDeleted || message.isDeletedByUser) {
    return (
      <div
        ref={ref}
        className={`flex items-start gap-3 mb-4 ${isFromContact ? "" : "flex-row-reverse"}`}
        data-message-id={message.id}
        data-index={index}
      >
        <Avatar className="w-9 h-9 flex-shrink-0 opacity-50">
          <AvatarImage src={avatarContent.src} />
          <AvatarFallback>{avatarContent.fallback}</AvatarFallback>
        </Avatar>
        <div
          className={`flex-1 max-w-md ${isFromContact ? "" : "flex flex-col items-end"}`}
        >
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-500 opacity-75">
            <span className="text-sm italic">Esta mensagem foi deletada</span>
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400`}>
            <span title={new Date(messageTimestamp).toLocaleString()}>
              {messageTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Memoização do conteúdo da mensagem
  const messageContent = useMemo(() => {
    // Se não estiver visível, renderizar placeholder para virtualização
    if (!isVisible) {
      return (
        <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      );
    }

    // Se não estiver em view, renderizar placeholder para lazy loading
    if (!isInView && (message.messageType === 'image' || message.messageType === 'video' || message.messageType === 'document')) {
      return (
        <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      );
    }

    switch (message.messageType) {
      case "audio":
        return (
          <AudioMessage
            audioUrl={message.content}
            isFromContact={isFromContact}
            messageIdForFetch={message.id.toString()}
            duration={(message.metadata as any)?.duration}
          />
        );
      case "image":
      case "video":
      case "document":
        return (
          <LazyMediaContent
            messageId={message.id}
            messageType={message.messageType}
            conversationId={conversationId}
            isFromContact={isFromContact}
            metadata={message.metadata}
            initialContent={message.content}
            isVisible={isInView}
          />
        );
      case "sticker":
        return message.content?.startsWith("data:") ? (
          <img
            src={message.content}
            alt="Figurinha"
            className="max-w-[200px] h-auto rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="p-3 rounded-lg bg-gray-100">🎭 Figurinha enviada</div>
        );
      case "text":
        return (
          <div
            className={`px-4 py-2 rounded-lg ${message.isInternalNote ? "bg-amber-50 text-amber-900 border border-amber-200" : isFromContact ? "bg-gray-100 text-gray-900" : "bg-blue-400 text-black"}`}
          >
            {message.isInternalNote && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-700">
                <StickyNote className="h-3 w-3" />
                <span className="font-medium">
                  Nota Interna • Visível apenas para a equipe
                </span>
              </div>
            )}
            {message.content ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <p className="text-sm italic">Mensagem sem conteúdo</p>
            )}
            {message.isInternalNote && message.authorName && (
              <div className="mt-2 text-xs text-amber-600 font-medium">
                {message.authorName}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="px-4 py-2 rounded-lg bg-red-50 text-red-900 border border-red-200">
            <div className="mb-1 font-semibold text-xs flex items-center gap-1">
              <span>Tipo de mensagem não suportado:</span>
              <span className="font-mono bg-red-100 px-2 py-0.5 rounded">{message.messageType || 'desconhecido'}</span>
            </div>
            {message.content ? (
              <p className="text-sm break-words">{message.content}</p>
            ) : (
              <p className="text-sm italic">Mensagem sem conteúdo</p>
            )}
          </div>
        );
    }
  }, [
    message,
    isFromContact,
    conversationId,
    isVisible,
    isInView,
    messageTime
  ]);

  // Memoização das ações
  const messageActions = useMemo(() => (
    <div
      className={`flex gap-1 mt-1 ${isFromContact ? "justify-start" : "justify-end"}`}
    >
      {isFromContact && onReply && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReply}
          className="h-7 px-2.5 text-xs opacity-60 hover:opacity-100"
        >
          <Reply className="w-3.5 h-3.5 mr-1" /> Responder
        </Button>
      )}
      {canDelete(message.sentAt) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-500 transition-opacity duration-200"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir mensagem</AlertDialogTitle>
              <AlertDialogDescription>
                {isFromContact
                  ? "Remover da interface (não apaga do WhatsApp)"
                  : "Remover permanentemente do WhatsApp"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMessage}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  ), [isFromContact, onReply, handleReply, canDelete, message.sentAt, isDeleting, handleDeleteMessage]);

  // Memoização das reações e status
  const messageFooter = useMemo(() => (
    <div className="flex flex-col gap-1 mt-1">
      {contact.phone && conversationId && (
        <div className="flex justify-end">
          <MessageReactions
            message={message}
            conversationId={conversationId}
            contactPhone={contact.phone}
          />
        </div>
      )}
      <div
        className={`flex items-center gap-1 ${isFromContact ? "text-xs text-gray-400" : "text-xs text-gray-500 justify-end"}`}
      >
        {messageStatus}
        <span title={new Date(messageTimestamp).toLocaleString()}>
          {messageTime}
        </span>
      </div>
    </div>
  ), [contact.phone, conversationId, message, isFromContact, messageStatus, messageTimestamp, messageTime]);

  return (
    <div
      ref={(el) => {
        // Combinar refs para virtualização e intersection observer
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
        messageRef.current = el;
      }}
      className={`group flex items-start gap-3 mb-4 ${isFromContact ? "" : "flex-row-reverse"}`}
      data-message-id={message.id}
      data-index={index}
      data-visible={isVisible}
    >
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarImage src={avatarContent.src} />
        <AvatarFallback>{avatarContent.fallback}</AvatarFallback>
      </Avatar>

      <div
        className={`flex-1 max-w-md ${isFromContact ? "" : "flex flex-col items-end"}`}
      >
        {messageContent}
        {messageActions}
        {messageFooter}
      </div>
    </div>
  );
}));

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
