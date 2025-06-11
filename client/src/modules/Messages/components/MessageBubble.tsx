import { useState, useRef, useMemo } from "react";
import { Check, CheckCheck, Play, Pause, Volume2, FileText, Download, Trash2, StickyNote, Reply } from "lucide-react";
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
import { MessageReactions } from "./MessageReactions";
import { LazyMediaContent } from "./LazyMediaContent";
import { AudioMessage } from "./AudioMessage";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTime } from "@/shared/lib/utils/formatters";
import type { Message, Contact } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
  onReply?: (message: Message) => void;
}

export function MessageBubble({
  message,
  contact,
  channelIcon,
  channelColor,
  conversationId,
  onReply,
}: MessageBubbleProps) {
  const isFromContact = message.isFromContact;
  const { toast } = useToast();
  
  const messageTimestamp = message.deliveredAt || message.sentAt || new Date();

  const messageTime = useMemo(
    () => {
      const date = messageTimestamp instanceof Date ? messageTimestamp : new Date(messageTimestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
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

  const bubbleClasses = message.isInternalNote
    ? "bg-amber-50 text-amber-900 border border-amber-200"
    : isFromContact
    ? "bg-gray-100 text-gray-900"
    : "bg-blue-600 text-white";

  const timeClasses = isFromContact
    ? "text-xs text-gray-400"
    : "text-xs text-gray-500 justify-end";

  const containerClasses = `flex items-start gap-3 ${
    isFromContact ? "flex-row" : "flex-row-reverse"
  } mb-4`;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Verificar se a mensagem pode ser deletada
  const canDelete = () => {
    const now = new Date();
    const sevenMinutesInMs = 7 * 60 * 1000;
    
    if (isFromContact) {
      const messageDate = new Date(message.sentAt || new Date());
      const timeDifference = now.getTime() - messageDate.getTime();
      return timeDifference <= sevenMinutesInMs;
    } else {
      const messageDate = new Date(message.sentAt || new Date());
      const timeDifference = now.getTime() - messageDate.getTime();
      return timeDifference <= sevenMinutesInMs;
    }
  };

  const handleDeleteMessage = async () => {
    if (!conversationId) return;

    setIsDeleting(true);
    try {
      if (isFromContact) {
        const response = await apiRequest("POST", "/api/messages/soft-delete", {
          messageId: message.id,
          conversationId: conversationId,
        });

        setIsDeleted(true);
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${conversationId}/messages`],
        });

        toast({
          title: "Sucesso",
          description: "Mensagem removida da interface",
        });
      } else {
        const metadata =
          message.metadata && typeof message.metadata === "object"
            ? message.metadata
            : {};
        let messageId = null;

        if ("messageId" in metadata && metadata.messageId) {
          messageId = metadata.messageId;
        } else if ("zaapId" in metadata && metadata.zaapId) {
          messageId = metadata.zaapId;
        } else if ("id" in metadata && metadata.id) {
          messageId = metadata.id;
        }

        if (!messageId) {
          toast({
            title: "Erro",
            description: "Esta mensagem não pode ser deletada (ID da Z-API não encontrado)",
            variant: "destructive",
          });
          return;
        }

        const response = await apiRequest("POST", "/api/zapi/delete-message", {
          phone: contact.phone,
          messageId: messageId.toString(),
          conversationId: conversationId,
        });

        setIsDeleted(true);
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${conversationId}/messages`],
        });

        toast({
          title: "Sucesso",
          description: "Mensagem deletada com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);

      let errorMessage = "Não foi possível deletar a mensagem";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as Error).message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) {
    return (
      <div className="flex items-center justify-center py-2 text-xs text-gray-400 italic">
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          Esta mensagem foi removida
        </div>
      </div>
    );
  }

  // Função para renderizar o conteúdo da mensagem baseado no tipo
  const renderMessageContent = () => {
    if (message.messageType === 'audio') {
      // Verificar se temos uma URL válida para o áudio
      let audioUrl: string | null = null;
      
      if (message.content && message.content.startsWith('data:audio/')) {
        audioUrl = message.content;
      }
      else if (message.content && message.content.startsWith('data:') && message.content.includes('base64,')) {
        audioUrl = message.content;
      }
      else if (message.content && message.content.match(/^[A-Za-z0-9+/]+=*$/)) {
        const mimeType = (message.metadata as any)?.mimeType || 'audio/mp4';
        audioUrl = `data:${mimeType};base64,${message.content}`;
      }
      else if (message.content && (message.content.startsWith('http://') || message.content.startsWith('https://'))) {
        audioUrl = message.content;
      }
      else if ((message.metadata as any)?.audio?.audioUrl) {
        audioUrl = (message.metadata as any).audio.audioUrl;
      }
      else if ((message.metadata as any)?.mediaUrl) {
        audioUrl = (message.metadata as any).mediaUrl;
      }

      const duration = (message.metadata as any)?.audio?.duration || (message.metadata as any)?.duration || 0;
      
      if (audioUrl) {
        return (
          <AudioMessage
            audioUrl={audioUrl}
            duration={duration}
            isFromContact={isFromContact}
          />
        );
      }

      const messageIdFromMetadata = (message.metadata as any)?.messageId;
      if (messageIdFromMetadata) {
        return (
          <AudioMessage
            audioUrl={null}
            duration={duration}
            isFromContact={isFromContact}
            messageIdForFetch={messageIdFromMetadata}
          />
        );
      }

      if ((message.metadata as any)?.audioSent && !isFromContact) {
        return (
          <AudioMessage
            audioUrl={null}
            duration={duration}
            isFromContact={isFromContact}
            messageIdForFetch={message.id.toString()}
          />
        );
      }
      
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <Volume2 className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">Áudio indisponível</span>
        </div>
      );
    }

    // Renderizar figurinha
    if (message.messageType === 'sticker') {
      return (
        <div className="max-w-xs">
          {message.content && message.content.startsWith('data:') ? (
            <img
              src={message.content}
              alt="Figurinha"
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '200px', maxWidth: '200px' }}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100">
              <div className="text-2xl">🎭</div>
              <span className="text-sm text-gray-600">Figurinha enviada</span>
            </div>
          )}
        </div>
      );
    }

    // Para todos os tipos de mídia (image, video, document), usar LazyMediaContent
    if (message.messageType && ['image', 'video', 'document'].includes(message.messageType as string)) {
      return (
        <LazyMediaContent
          messageId={message.id}
          messageType={message.messageType as "audio" | "video" | "image" | "document"}
          conversationId={conversationId}
          isFromContact={isFromContact}
          metadata={message.metadata}
          initialContent={message.content}
        />
      );
    }

    // Mensagem de texto padrão
    return (
      <div className={`px-4 py-2 rounded-lg ${bubbleClasses}`}>
        {message.isInternalNote && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-700">
            <StickyNote className="h-3 w-3" />
            <span className="font-medium">Nota Interna • Visível apenas para a equipe</span>
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
        {message.isInternalNote && message.authorName && (
          <div className="mt-2 text-xs text-amber-600 font-medium">
            {message.authorName}
          </div>
        )}
      </div>
    );
  };

  // Mensagem normal
  return (
    <div className={containerClasses}>
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarImage
          src={isFromContact ? contact.profileImageUrl || "" : ""}
          alt={isFromContact ? contact.name : "Agente"}
        />
        <AvatarFallback className="text-sm">
          {avatarFallbackChar}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 max-w-lg">
        <div className="flex flex-col gap-1">
          {renderMessageContent()}

          <div className={`flex items-center gap-1 mt-1 ${timeClasses}`}>
            <span title={new Date(messageTimestamp).toLocaleString()}>
              {messageTime}
            </span>
            {messageStatus}
            
            {!message.isInternalNote && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onReply(message)}
                title="Responder"
              >
                <Reply className="h-3 w-3" />
              </Button>
            )}

            {canDelete() && conversationId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                    title="Deletar mensagem"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar mensagem</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isFromContact
                        ? "Esta ação irá ocultar a mensagem apenas da sua interface. A mensagem ainda será visível para o contato."
                        : "Esta ação irá deletar a mensagem permanentemente para ambos os lados da conversa."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteMessage}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Deletando..." : "Deletar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <MessageReactions
          messageId={message.id}
          conversationId={conversationId || 0}
          contactPhone={contact.phone}
          isFromContact={isFromContact}
        />
      </div>
    </div>
  );
}