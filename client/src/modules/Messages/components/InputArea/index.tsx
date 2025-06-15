import { useState, useRef, useEffect } from "react";
import { Mic, Send } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { useSendMessage } from "@/shared/lib/hooks/useMessages";
import { useSendAudioMessage } from "@/shared/lib/hooks/useAudioMessage";
import { useWebSocket } from "@/shared/lib/hooks/useWebSocket";
import { useChatStore } from "@/shared/store/chatStore";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { AudioRecorderRef } from "../AudioRecorder";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuickReply } from "@shared/schema";

// Importar todos os subcomponentes modulares
import { AudioRecorderSection } from "./AudioRecorderSection";
import { QuickReplyDropdown } from "./QuickReplyDropdown";
import { EmojiReactionPopover } from "./EmojiReactionPopover";
import { AttachmentDialog } from "./AttachmentDialog";
import { InternalNoteToggle } from "./InternalNoteToggle";
import { QuickReplyChips } from "./QuickReplyChips";

export function InputArea() {
  // Estados principais
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState("");
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Frequentes");

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);

  // Hooks
  const { activeConversation } = useChatStore();
  const { sendTypingIndicator } = useWebSocket();
  const sendMessageMutation = useSendMessage();
  const sendAudioMutation = useSendAudioMessage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ["/api/quick-replies"],
    enabled: true,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 1000 * 60 * 10,
    enabled: isInternalNote,
  });

  // Filtrar respostas rápidas
  const filteredQuickReplies = quickReplies.filter(
    (reply) =>
      reply.title.toLowerCase().includes(quickReplyFilter.toLowerCase()) ||
      (reply.description?.toLowerCase().includes(quickReplyFilter.toLowerCase()) ?? false),
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  // Mutations para anexos
  const sendImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("image", file);

      const response = await fetch("/api/zapi/send-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar imagem");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso!",
      });
      setIsAttachmentOpen(false);
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar imagem:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("video", file);

      const response = await fetch("/api/zapi/send-video", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(180000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao enviar vídeo: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vídeo enviado",
        description: "Seu vídeo foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar vídeo:", error);
      const isTimeout = error instanceof Error && 
        (error.name === "TimeoutError" || error.message.includes("timeout"));
      toast({
        title: "Erro ao enviar vídeo",
        description: isTimeout
          ? "O vídeo é muito grande. Arquivos maiores que 50MB podem demorar mais para enviar."
          : "Não foi possível enviar o vídeo. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("document", file);

      const response = await fetch("/api/zapi/send-document", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao enviar documento");
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar documento:", error);
      toast({
        title: "Erro ao enviar documento",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendLinkMutation = useMutation({
    mutationFn: async ({ url, text }: { url: string; text: string }) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const response = await apiRequest("POST", "/api/zapi/send-link", {
        phone: activeConversation.contact.phone,
        conversationId: activeConversation.id,
        url: url,
        text: text,
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Link enviado",
        description: "Seu link foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar link:", error);
      toast({
        title: "Erro ao enviar link",
        description: "Não foi possível enviar o link. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendQuickReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!activeConversation?.contact.phone) {
        throw new Error("Número do contato não disponível");
      }

      const response = await apiRequest("POST", "/api/zapi/send-reaction", {
        phone: activeConversation.contact.phone,
        emoji: emoji,
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reação enviada",
        description: "Sua reação foi enviada com sucesso!",
      });
      setIsEmojiOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao enviar reação:", error);
      toast({
        title: "Erro ao enviar reação",
        description: "Não foi possível enviar a reação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handlers orquestradores
  const handleTyping = (value: string) => {
    setMessage(value);

    // Detectar "/" para ativar respostas rápidas
    const lastSlashIndex = value.lastIndexOf("/");
    if (lastSlashIndex !== -1 && lastSlashIndex === value.length - 1) {
      setShowQuickReplies(true);
      setQuickReplyFilter("");
      setSelectedQuickReplyIndex(0);
    } else if (
      lastSlashIndex !== -1 &&
      value.substring(lastSlashIndex + 1).indexOf(" ") === -1
    ) {
      setShowQuickReplies(true);
      setQuickReplyFilter(value.substring(lastSlashIndex + 1));
      setSelectedQuickReplyIndex(0);
    } else {
      setShowQuickReplies(false);
      setQuickReplyFilter("");
    }

    if (!activeConversation) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeConversation.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(activeConversation.id, false);
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    const messageContent = message.trim();
    setMessage("");

    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation.id, false);
    }

    try {
      if (isInternalNote) {
        const authorName =
          (currentUser as any)?.displayName ||
          (currentUser as any)?.username ||
          "Usuário";

        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: messageContent,
            isFromContact: false,
            messageType: "text",
            isInternalNote: true,
            authorName: authorName,
            authorId: (currentUser as any)?.id,
          },
          contact: activeConversation.contact,
        });

        setIsInternalNote(false);
      } else {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: messageContent,
            isFromContact: false,
            messageType: "text",
          },
          contact: activeConversation.contact,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showQuickReplies && filteredQuickReplies.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) =>
          prev < filteredQuickReplies.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) =>
          prev > 0 ? prev - 1 : filteredQuickReplies.length - 1,
        );
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        selectQuickReply(filteredQuickReplies[selectedQuickReplyIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowQuickReplies(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showQuickReplies && filteredQuickReplies.length > 0) {
        selectQuickReply(filteredQuickReplies[selectedQuickReplyIndex]);
      } else {
        handleSendMessage();
      }
    }
  };

  const selectQuickReply = (quickReply: QuickReply) => {
    const lastSlashIndex = message.lastIndexOf("/");
    const beforeSlash = message.substring(0, lastSlashIndex);

    let content = "";
    if (quickReply.type === "text") {
      content = quickReply.content || "";
    } else if (quickReply.type === "audio" && quickReply.fileUrl) {
      handleSendQuickReplyMedia(quickReply, "audio");
      return;
    } else if (quickReply.type === "image" && quickReply.fileUrl) {
      handleSendQuickReplyMedia(quickReply, "image");
      return;
    } else if (quickReply.type === "video" && quickReply.fileUrl) {
      handleSendQuickReplyMedia(quickReply, "video");
      return;
    }

    setMessage(beforeSlash + content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const handleSendQuickReplyMedia = async (quickReply: QuickReply, type: string) => {
    if (!activeConversation || !quickReply.fileUrl) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: type as any,
        },
        contact: activeConversation.contact,
      });
      setMessage("");
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao enviar ${type}. Tente novamente.`,
        variant: "destructive",
      });
    }
  };

  const insertQuickReply = (reply: string) => {
    setMessage(reply);
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleQuickReaction = (emoji: string) => {
    sendQuickReactionMutation.mutate(emoji);
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;

    setShowAudioRecorder(false);

    try {
      await sendAudioMutation.mutateAsync({
        conversationId: activeConversation.id,
        audioBlob,
        duration,
        contact: activeConversation.contact,
      });
      toast({
        title: "Áudio enviado",
        description: "Sua mensagem de áudio foi enviada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar áudio",
        description: "Falha ao enviar mensagem de áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAudio = () => {
    setShowAudioRecorder(false);
    setIsRecording(false);
  };

  const handleMicrophoneClick = () => {
    if (showAudioRecorder) {
      setShowAudioRecorder(false);
      setIsRecording(false);
    } else {
      setShowAudioRecorder(true);
      setIsRecording(true);
    }
  };

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Componente de gravação de áudio */}
      <AudioRecorderSection
        showAudioRecorder={showAudioRecorder}
        isRecording={isRecording}
        audioRecorderRef={audioRecorderRef}
        onSendAudio={handleSendAudio}
        onCancel={handleCancelAudio}
        onRecordingStateChange={setIsRecording}
      />

      {/* Interface de digitação sempre visível */}
      <div className="flex items-end space-x-3">
        <AttachmentDialog
          isOpen={isAttachmentOpen}
          onOpenChange={setIsAttachmentOpen}
          onSendImage={(file) => sendImageMutation.mutate(file)}
          onSendVideo={(file) => sendVideoMutation.mutate(file)}
          onSendDocument={(file) => sendDocumentMutation.mutate(file)}
          onSendLink={({ url, text }) => sendLinkMutation.mutate({ url, text })}
          activeConversation={activeConversation}
          isPendingImage={sendImageMutation.isPending}
          isPendingVideo={sendVideoMutation.isPending}
          isPendingDocument={sendDocumentMutation.isPending}
          isPendingLink={sendLinkMutation.isPending}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMicrophoneClick}
          className={cn(
            "p-2.5 text-educhat-medium hover:text-educhat-blue",
            (showAudioRecorder || isRecording) &&
              "bg-red-500 text-white hover:bg-red-600",
          )}
        >
          <Mic className="w-5.5 h-5.5" />
        </Button>

        <EmojiReactionPopover
          isOpen={isEmojiOpen}
          onOpenChange={setIsEmojiOpen}
          onInsertEmoji={insertEmoji}
          onSendReaction={handleQuickReaction}
          activeConversation={activeConversation}
          isPending={sendQuickReactionMutation.isPending}
          activeEmojiCategory={activeEmojiCategory}
          onCategoryChange={setActiveEmojiCategory}
        />

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[48px] max-h-[140px] resize-none pr-20 border-gray-300 focus:ring-2 focus:ring-educhat-primary focus:border-transparent text-base"
            rows={1}
          />

          <InternalNoteToggle
            isInternalNote={isInternalNote}
            onToggle={setIsInternalNote}
          />

          <QuickReplyDropdown
            visible={showQuickReplies}
            filteredReplies={filteredQuickReplies}
            onSelect={selectQuickReply}
            selectedIndex={selectedQuickReplyIndex}
          />
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className={cn(
            "bg-educhat-primary hover:bg-educhat-secondary text-white p-3.5 rounded-xl transition-colors",
            sendMessageMutation.isPending && "opacity-50 cursor-not-allowed",
          )}
        >
          {sendMessageMutation.isPending ? (
            <div className="w-5.5 h-5.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-5.5 h-5.5" />
          )}
        </Button>
      </div>

      {/* Quick Replies */}
      <QuickReplyChips onSelect={insertQuickReply} />
    </div>
  );
}