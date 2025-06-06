import { useState, useRef, useMemo } from "react";
import { Check, CheckCheck, Play, Pause, Volume2, FileText, Download, Trash2, StickyNote, Reply } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/shared/ui/ui/alert-dialog";
import { format } from "date-fns";
import { MessageReactions } from "./MessageReactions";
import { LazyMediaContent } from "./LazyMediaContent";
import { AudioMessageSimple } from "./AudioMessageSimple";
import { AudioMessageSimple as AudioMessage } from "./AudioMessageSimple";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message, Contact } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  contact: Contact;
  channelIcon?: string;
  channelColor?: string;
  conversationId?: number;
  onReply?: (message: Message) => void;
}

// Função auxiliar para formatar o horário
const formatTime = (timestamp: Date | string | number) =>
  format(new Date(timestamp), "HH:mm");

// Componente para exibir mensagem de imagem
function ImageMessage({
  message,
  isFromContact,
}: {
  message: Message;
  isFromContact: boolean;
}) {
  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? message.metadata
      : {};
  const fileName = (metadata as any).fileName || "Imagem";
  const fileSize = (metadata as any).fileSize;
  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : "";

  // Verificar múltiplas fontes de URL da imagem
  let imageUrl = null;

  // 1. Verificar se é uma imagem em base64 (enviadas pelo sistema)
  if (message.content?.startsWith("data:image/")) {
    imageUrl = message.content;
  }
  // 2. Verificar se há URL da imagem nos metadados (recebidas via WhatsApp)
  else if (metadata && typeof metadata === "object") {
    const meta = metadata as any;
    // Verificar imageUrl no objeto image dos metadados
    if (meta.image && meta.image.imageUrl) {
      imageUrl = meta.image.imageUrl;
    }
    // Verificar thumbnailUrl como fallback
    else if (meta.image && meta.image.thumbnailUrl) {
      imageUrl = meta.image.thumbnailUrl;
    }
    // Verificar se há imageUrl diretamente nos metadados
    else if (meta.imageUrl) {
      imageUrl = meta.imageUrl;
    }
  }

  return (
    <div
      className={`max-w-md ${
        isFromContact ? "bg-gray-100" : "bg-blue-600"
      } rounded-lg overflow-hidden`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={fileName}
          className="w-full h-auto max-h-96 object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={`p-4 text-center ${
            isFromContact ? "text-gray-600" : "text-white"
          }`}
        >
          <div className="text-sm">📷 Imagem não disponível</div>
          <div className="text-xs opacity-75">
            {fileName}
            {sizeText}
          </div>
        </div>
      )}

      {imageUrl && (
        <div
          className={`px-3 py-2 text-xs ${
            isFromContact
              ? "text-gray-600 bg-gray-50"
              : "text-blue-100 bg-blue-700"
          }`}
        >
          {fileName}
          {sizeText}
        </div>
      )}
    </div>
  );
}

// Componente para exibir mensagem de vídeo
function VideoMessage({
  message,
  isFromContact,
}: {
  message: Message;
  isFromContact: boolean;
}) {
  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? message.metadata
      : {};
  const fileName = (metadata as any).fileName || "Vídeo";
  const fileSize = (metadata as any).fileSize;
  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : "";

  // Verificar se é um vídeo válido
  const videoUrl = message.content?.startsWith("data:video/")
    ? message.content
    : null;

  return (
    <div
      className={`max-w-md ${
        isFromContact ? "bg-gray-100" : "bg-blue-600"
      } rounded-lg overflow-hidden`}
    >
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full h-auto max-h-96"
          preload="metadata"
        >
          Seu navegador não suporta a reprodução de vídeo.
        </video>
      ) : (
        <div
          className={`p-4 text-center ${
            isFromContact ? "text-gray-600" : "text-white"
          }`}
        >
          <div className="text-sm">🎥 Vídeo não disponível</div>
          <div className="text-xs opacity-75">
            {fileName}
            {sizeText}
          </div>
        </div>
      )}

      {videoUrl && (
        <div
          className={`px-3 py-2 text-xs ${
            isFromContact
              ? "text-gray-600 bg-gray-50"
              : "text-blue-100 bg-blue-700"
          }`}
        >
          {fileName}
          {sizeText}
        </div>
      )}
    </div>
  );
}

// Componente para exibir mensagens de documento
function DocumentMessage({
  message,
  isFromContact,
}: {
  message: Message;
  isFromContact: boolean;
}) {
  // Extrair informações do documento dos metadados
  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? message.metadata
      : {};
  const fileName =
    "fileName" in metadata ? (metadata.fileName as string) : "Documento";
  const fileSize =
    "fileSize" in metadata ? (metadata.fileSize as number) : null;
  const mimeType = "mimeType" in metadata ? (metadata.mimeType as string) : "";

  const sizeText = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : "";

  // Função para determinar o ícone baseado no tipo de arquivo
  const getFileIcon = (mimeType: string, fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    if (mimeType.includes("pdf") || extension === "pdf") {
      return "📄";
    } else if (
      mimeType.includes("word") ||
      ["doc", "docx"].includes(extension)
    ) {
      return "📝";
    } else if (
      mimeType.includes("excel") ||
      ["xls", "xlsx"].includes(extension)
    ) {
      return "📊";
    } else if (
      mimeType.includes("powerpoint") ||
      ["ppt", "pptx"].includes(extension)
    ) {
      return "📑";
    } else if (
      mimeType.includes("zip") ||
      ["zip", "rar", "7z"].includes(extension)
    ) {
      return "🗂️";
    } else {
      return "📄";
    }
  };

  const handleDownload = () => {
    if (message.content && message.content.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = message.content;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={`max-w-md ${
        isFromContact ? "bg-gray-100" : "bg-blue-600"
      } rounded-lg overflow-hidden`}
    >
      <div className={`p-4 ${isFromContact ? "text-gray-900" : "text-white"}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getFileIcon(mimeType, fileName)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{fileName}</div>
            <div
              className={`text-xs ${
                isFromContact ? "text-gray-500" : "text-blue-100"
              }`}
            >
              Documento{sizeText}
            </div>
          </div>
          {message.content && message.content.startsWith("data:") && (
            <button
              onClick={handleDownload}
              className={`p-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-colors ${
                isFromContact ? "text-gray-600 hover:bg-gray-200" : "text-white"
              }`}
              title="Baixar documento"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
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

  const bubbleClasses = message.isInternalNote
    ? "bg-amber-50 text-amber-900 border border-amber-200"
    : isFromContact
    ? "bg-gray-100 text-gray-900"
    : "bg-blue-600 text-white";

  const timeClasses = isFromContact
    ? "text-xs text-gray-400"
    : "text-xs text-gray-500 justify-end";

  const containerClasses = `flex items-start gap-3 mb-4 ${isFromContact ? "" : "flex-row-reverse"}`;

  const bubbleWrapperClasses = `flex-1 max-w-md ${isFromContact ? "" : "flex flex-col items-end"}`;

  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? message.metadata
      : {};
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Verificar se a mensagem pode ser deletada (dentro de 7 minutos para WhatsApp)
  const canDelete = () => {
    if (isFromContact) return false; // Só permite deletar mensagens enviadas pelo agente

    const messageDate = new Date(message.sentAt || new Date());
    const now = new Date();
    const timeDifference = now.getTime() - messageDate.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000; // 7 minutos em milissegundos

    return timeDifference <= sevenMinutesInMs;
  };

  const handleDeleteMessage = async () => {
    if (!contact.phone || !conversationId) return;

    // Extrair messageId dos metadados - tentar múltiplas possibilidades
    const metadata =
      message.metadata && typeof message.metadata === "object"
        ? message.metadata
        : {};
    let messageId = null;

    // Buscar o ID da mensagem nos metadados em diferentes campos possíveis
    if ("messageId" in metadata && metadata.messageId) {
      messageId = metadata.messageId;
    } else if ("zaapId" in metadata && metadata.zaapId) {
      messageId = metadata.zaapId;
    } else if ("id" in metadata && metadata.id) {
      messageId = metadata.id;
    }

    // Log para debug
    console.log("🗑️ Tentando deletar mensagem:", {
      messageLocalId: message.id,
      messageId,
      metadata,
      phone: contact.phone,
      conversationId,
    });

    if (!messageId) {
      toast({
        title: "Erro",
        description:
          "Esta mensagem não pode ser deletada (ID da Z-API não encontrado)",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest("POST", "/api/zapi/delete-message", {
        phone: contact.phone,
        messageId: messageId.toString(),
        conversationId: conversationId,
      });

      console.log("✅ Resposta da exclusão:", response);

      // Marcar mensagem como deletada localmente e invalidar cache
      setIsDeleted(true);

      // Invalidar cache para recarregar mensagens com status atualizado
      queryClient.invalidateQueries({
        queryKey: [`/api/conversations/${conversationId}/messages`],
      });

      toast({
        title: "Sucesso",
        description: "Mensagem deletada com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao deletar mensagem:", error);

      // Mostrar erro mais específico baseado na resposta
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

  // Mensagem deletada
  if (isDeleted || message.isDeleted) {
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

        {/* Ações da mensagem - Botões de Responder e Excluir */}
        {contact.phone && conversationId && (
          <div className={`flex gap-1 mt-1 ${isFromContact ? 'justify-start' : 'justify-end'}`}>
            {/* Botão de Responder - apenas para mensagens do contato */}
            {isFromContact && onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(message)}
                className="h-6 px-2 text-xs opacity-60 hover:opacity-100"
              >
                <Reply className="w-3 h-3 mr-1" />
                Responder
              </Button>
            )}
            
            {/* Botão de Excluir - apenas para mensagens enviadas pelo agente e dentro de 7 minutos */}
            {!isFromContact && canDelete() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    className="h-6 px-2 text-xs opacity-60 hover:opacity-100 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir mensagem</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
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
        )}

        {/* Reações e informações da mensagem */}
        <div className="flex flex-col gap-1 mt-1">
          {/* Reações - apenas para mensagens de contatos do WhatsApp */}
          {contact.phone && conversationId && (
            <div className="flex justify-end">
              <MessageReactions
                message={message}
                conversationId={conversationId}
                contactPhone={contact.phone}
              />
            </div>
          )}
          
          {/* Horário e status */}
          <div className={`flex items-center gap-1 ${timeClasses}`}>
            {messageStatus}
            <span title={new Date(messageTimestamp).toLocaleString()}>
              {messageTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
