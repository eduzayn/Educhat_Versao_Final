import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Smile,
  Send,
  Mic,
  Image,
  Video,
  FileText,
  Link,
  Upload,
  Zap,
  MessageSquare,
  StickyNote,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { useSendMessage } from "@/shared/lib/hooks/useMessages";
import { useSendAudioMessage } from "@/shared/lib/hooks/useAudioMessage";
import { useWebSocket } from "@/shared/lib/hooks/useWebSocket";
import { useChatStore } from "@/shared/store/chatStore";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { AudioRecorder, AudioRecorderRef } from "./AudioRecorder";
import { MediaAttachmentModal } from "./MediaAttachmentModal";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuickReply } from "@shared/schema";

const QUICK_REPLIES = [
  "Obrigado pelo contato!",
  "Posso te ajudar com mais alguma coisa?",
  "Agende uma conversa",
];

// Emojis organizados por categoria
const EMOJI_CATEGORIES = {
  "Frequentes": ["👍", "❤️", "😊", "😂", "🙏", "👏", "🔥", "💯"],
  "Pessoas": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
  "Gestos": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  "Objetos": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚡", "💥", "💫", "⭐", "🌟", "✨", "🔥", "💯", "💢", "💨", "💦", "💤"],
  "Natureza": ["🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋"],
  "Comida": ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕"]
};

export function InputArea() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState("");
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Frequentes");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);

  const { activeConversation } = useChatStore();
  const { sendTypingIndicator } = useWebSocket();
  const sendMessageMutation = useSendMessage();
  const sendAudioMutation = useSendAudioMessage();
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Buscar respostas rápidas do servidor
  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ["/api/quick-replies"],
    enabled: true,
  });

  // Query para buscar usuário atual (para notas internas)
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: isInternalNote // Só busca quando necessário
  });

  // Filtrar respostas rápidas baseado no texto após "/"
  const filteredQuickReplies = quickReplies.filter(
    (reply) =>
      reply.title.toLowerCase().includes(quickReplyFilter.toLowerCase()) ||
      (reply.description
        ?.toLowerCase()
        .includes(quickReplyFilter.toLowerCase()) ??
        false),
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleTyping = (value: string) => {
    setMessage(value);

    // Detectar "/" para ativar respostas rápidas
    const lastSlashIndex = value.lastIndexOf("/");
    if (lastSlashIndex !== -1 && lastSlashIndex === value.length - 1) {
      // "/" no final da mensagem
      setShowQuickReplies(true);
      setQuickReplyFilter("");
      setSelectedQuickReplyIndex(0);
    } else if (
      lastSlashIndex !== -1 &&
      value.substring(lastSlashIndex + 1).indexOf(" ") === -1
    ) {
      // "/" seguido de texto sem espaço
      setShowQuickReplies(true);
      setQuickReplyFilter(value.substring(lastSlashIndex + 1));
      setSelectedQuickReplyIndex(0);
    } else {
      // Não há "/" ativo ou há espaço após o texto
      setShowQuickReplies(false);
      setQuickReplyFilter("");
    }

    if (!activeConversation) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeConversation.id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
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

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation.id, false);
    }

    try {
      if (isInternalNote) {
        // Enviar nota interna com nome do usuário atual
        const authorName = (currentUser as any)?.displayName || (currentUser as any)?.username || 'Usuário';
        
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
        
        setIsInternalNote(false); // Reset nota interna state
      } else {
        // Enviar mensagem normal
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
    // Navegação nas respostas rápidas
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
      // Para áudio, enviar diretamente
      handleSendQuickReplyAudio(quickReply);
      return;
    } else if (quickReply.type === "image" && quickReply.fileUrl) {
      // Para imagem, enviar diretamente
      handleSendImage(quickReply);
      return;
    } else if (quickReply.type === "video" && quickReply.fileUrl) {
      // Para vídeo, enviar diretamente
      handleSendVideo(quickReply);
      return;
    }

    setMessage(beforeSlash + content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const handleSendQuickReplyAudio = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;

    try {
      // Para áudio de resposta rápida, enviaremos via sendMessage
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: "audio",
        },
        contact: activeConversation.contact,
      });
      setMessage("");
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSendImage = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: "image",
        },
        contact: activeConversation.contact,
      });
      setMessage("");
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSendVideo = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: "video",
        },
        contact: activeConversation.contact,
      });
      setMessage("");
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar vídeo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const insertQuickReply = (reply: string) => {
    setMessage(reply);
    textareaRef.current?.focus();
  };

  // Mutation para enviar reação rápida
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

  const handleQuickReaction = (emoji: string) => {
    sendQuickReactionMutation.mutate(emoji);
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Mutation para enviar imagem
  const sendImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("image", file);

      // Criar controller para timeout personalizado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000); // 2 minutos para imagens

      try {
        const response = await fetch("/api/zapi/send-image", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar imagem");
        }

        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Tratamento específico para diferentes tipos de erro
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Timeout: O arquivo é muito grande ou a conexão está lenta. Tente novamente.');
          } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Erro de conexão: Verifique sua internet e tente novamente.');
          } else if (error.message.includes('NetworkError')) {
            throw new Error('Erro de rede: Não foi possível conectar ao servidor.');
          }
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso!",
      });

      // Invalidar cache para atualizar mensagens
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

  // Mutation para enviar vídeo
  const sendVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("🎥 Iniciando envio de vídeo:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        conversationId: activeConversation?.id,
        contactPhone: activeConversation?.contact.phone,
      });

      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        console.error("❌ Dados da conversa não disponíveis");
        throw new Error("Dados da conversa não disponíveis");
      }

      try {
        const formData = new FormData();
        formData.append("phone", activeConversation.contact.phone);
        formData.append("conversationId", activeConversation.id.toString());
        formData.append("video", file);

        console.log("📤 Enviando FormData para servidor:", {
          phone: activeConversation.contact.phone,
          conversationId: activeConversation.id,
          fileName: file.name,
          fileSize: file.size,
        });

        // Criar controller para timeout personalizado compatível
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 180000); // 3 minutos

        const response = await fetch("/api/zapi/send-video", {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: {
            // Não definir Content-Type para FormData - deixar o browser definir automaticamente
          }
        });

        clearTimeout(timeoutId);

        console.log("📥 Resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Erro na resposta do servidor:", errorText);
          throw new Error(
            `Erro ao enviar vídeo: ${response.status} - ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("✅ Vídeo enviado com sucesso:", result);
        return result;
      } catch (error) {
        console.error("💥 Erro no processo de envio:", error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Timeout: O arquivo é muito grande ou a conexão está lenta. Tente novamente.');
          } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Erro de conexão: Verifique sua internet e tente novamente.');
          } else if (error.message.includes('NetworkError')) {
            throw new Error('Erro de rede: Não foi possível conectar ao servidor.');
          }
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Vídeo enviado",
        description: "Seu vídeo foi enviado com sucesso!",
      });

      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
        // Força um refetch imediato
        queryClient.refetchQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar vídeo:", error);
      const isTimeout =
        error instanceof Error &&
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

  // Mutation para enviar documento
  const sendDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      console.log("📄 Iniciando envio de documento:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        phone: activeConversation.contact.phone,
        conversationId: activeConversation.id,
      });

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("document", file);

      // Criar controller para timeout personalizado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000); // 2 minutos para documentos

      try {
        const response = await fetch("/api/zapi/send-document", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("📥 Resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        const responseData = await response.json();
        console.log("📊 Dados da resposta:", responseData);

        if (!response.ok) {
          console.error("❌ Erro na resposta:", responseData);
          throw new Error(responseData.error || "Erro ao enviar documento");
        }

        return responseData;
      } catch (error) {
        console.error("💥 Erro no processo de envio:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso!",
      });

      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
        // Força um refetch imediato
        queryClient.refetchQueries({
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

  // Mutation para enviar link
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
    onSuccess: (data) => {
      toast({
        title: "Link enviado",
        description: "Seu link foi enviado com sucesso!",
      });

      // Invalidar cache para atualizar mensagens
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





  // Função para upload de arquivos do MediaAttachmentModal
  const handleFileUpload = (file: File, caption?: string) => {
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      sendImageMutation.mutate(file);
    } else if (fileType.startsWith('video/')) {
      sendVideoMutation.mutate(file);
    } else if (fileType.startsWith('audio/')) {
      // Para áudio, usar a mesma lógica de documento por enquanto
      sendDocumentMutation.mutate(file);
    } else {
      sendDocumentMutation.mutate(file);
    }
  };

  // Função para compartilhar links do MediaAttachmentModal
  const handleLinkShare = (url: string, caption?: string) => {
    const linkText = caption && caption.trim() ? caption.trim() : url;
    sendLinkMutation.mutate({ url: url.trim(), text: linkText });
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;

    // Esconder o componente de gravação imediatamente
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
      // Se já está exibindo o gravador, cancelar
      setShowAudioRecorder(false);
      setIsRecording(false);
    } else {
      // Iniciar gravação diretamente - um único clique
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
      {showAudioRecorder && (
        <div className="mb-4 border rounded-lg p-3 bg-gray-50">
          <AudioRecorder
            ref={audioRecorderRef}
            onSendAudio={handleSendAudio}
            onCancel={handleCancelAudio}
            onRecordingStateChange={setIsRecording}
            autoStart={isRecording}
          />
        </div>
      )}

      {/* Indicador visual do modo de nota interna */}
      {isInternalNote && (
        <div className="mb-2 flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md text-xs text-amber-700 dark:text-amber-400 relative z-50 shadow-sm">
          <StickyNote className="h-3 w-3" />
          <span className="font-medium">Modo: Nota Interna (apenas equipe)</span>
        </div>
      )}

      {/* Interface de digitação sempre visível */}
      <div className="flex items-end space-x-3">
        <MediaAttachmentModal
          onFileUpload={handleFileUpload}
          onLinkShare={handleLinkShare}
          isUploading={sendImageMutation.isPending || sendVideoMutation.isPending || sendDocumentMutation.isPending}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMicrophoneClick}
          className={cn(
            "p-2.5 text-educhat-medium hover:text-educhat-blue",
            (showAudioRecorder || isRecording) && "bg-red-500 text-white hover:bg-red-600",
          )}
        >
          <Mic className="w-5.5 h-5.5" />
        </Button>



        {/* Botão de Emojis/Reações movido para fora da textarea */}
        <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-2.5 text-educhat-medium hover:text-educhat-blue"
              disabled={sendQuickReactionMutation.isPending}
            >
              {sendQuickReactionMutation.isPending ? (
                <div className="w-5.5 h-5.5 animate-spin rounded-full border border-gray-400 border-t-transparent" />
              ) : (
                <Smile className="w-5.5 h-5.5" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-96 p-0 z-40 glass-effect shadow-2xl rounded-2xl border-0" align="end">
            <div className="p-6">
              {/* Header elegante com gradiente e ícone animado */}
              <div className="relative mb-6 pb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-educhat-primary/10 via-blue-500/10 to-purple-500/10 rounded-xl -mx-3 -my-2"></div>
                <div className="relative flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-educhat-primary to-blue-500 rounded-full">
                      <Smile className="w-4 h-4 text-white" />
                    </div>
                    Emojis & Reações
                  </h4>
                  {activeConversation?.contact.phone && (
                    <span className="text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                      Clique • ou → para reação
                    </span>
                  )}
                </div>
              </div>

              {/* Navegação por categorias com design sofisticado */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveEmojiCategory(category)}
                    className={cn(
                      "text-xs px-4 py-2 h-9 rounded-full font-semibold transition-all duration-300 transform",
                      activeEmojiCategory === category 
                        ? "bg-gradient-to-r from-educhat-primary via-blue-500 to-purple-500 text-white shadow-xl shadow-educhat-primary/30 scale-110 border-0" 
                        : "bg-white/70 hover:bg-white text-gray-700 hover:scale-105 hover:shadow-lg border border-gray-200 hover:border-educhat-primary/30"
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Grid de emojis com animações elegantes */}
              <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                <div className="grid grid-cols-9 gap-2 emoji-grid-enter">
                  {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                    <div key={`${activeEmojiCategory}-${index}`} className="flex flex-col items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertEmoji(emoji)}
                        className="emoji-button-hover h-11 w-11 p-0 text-xl bg-white/50 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 rounded-xl transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-gray-200/50 border border-gray-100 hover:border-educhat-primary/30"
                        title={`Inserir ${emoji} no texto`}
                      >
                        {emoji}
                      </Button>
                      {activeConversation?.contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickReaction(emoji)}
                          className="h-6 w-11 p-0 text-xs bg-gradient-to-r from-educhat-primary/15 via-blue-500/15 to-purple-500/15 text-educhat-primary hover:from-educhat-primary hover:via-blue-500 hover:to-purple-500 hover:text-white rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg border border-educhat-primary/20 hover:border-0"
                          title={`Enviar reação ${emoji}`}
                          disabled={sendQuickReactionMutation.isPending}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info elegante para contatos sem WhatsApp */}
              {!activeConversation?.contact.phone && (
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 rounded-2xl text-sm text-amber-800 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 bg-amber-100 rounded-full">
                      <span className="text-lg">💡</span>
                    </div>
                    <span className="font-semibold">Reações WhatsApp</span>
                  </div>
                  <span className="text-xs text-amber-700">Disponíveis apenas para contatos com número</span>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

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
          
          {/* Botões de toggle entre Mensagem e Nota Interna - movidos para a direita */}
          <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                      !isInternalNote ? "text-blue-600" : "text-gray-400"
                    )}
                    onClick={() => setIsInternalNote(false)}
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mensagem</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                      isInternalNote ? "text-amber-600" : "text-gray-400"
                    )}
                    onClick={() => setIsInternalNote(true)}
                  >
                    <StickyNote className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nota Interna</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Dropdown de Respostas Rápidas */}
          {showQuickReplies && filteredQuickReplies.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Respostas Rápidas ({filteredQuickReplies.length})
                </div>
              </div>
              {filteredQuickReplies.map((reply, index) => (
                <div
                  key={reply.id}
                  className={cn(
                    "p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50",
                    index === selectedQuickReplyIndex &&
                      "bg-blue-50 border-blue-200",
                  )}
                  onClick={() => selectQuickReply(reply)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {reply.title}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {reply.type === "text"
                            ? "Texto"
                            : reply.type === "audio"
                              ? "Áudio"
                              : reply.type === "image"
                                ? "Imagem"
                                : "Vídeo"}
                        </Badge>
                      </div>
                      {reply.description && (
                        <p className="text-sm text-gray-600 mb-1">
                          {reply.description}
                        </p>
                      )}
                      {reply.type === "text" && reply.content && (
                        <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded truncate max-w-xs">
                          {reply.content}
                        </p>
                      )}
                      {reply.type === "audio" && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Mic className="w-4 h-4 mr-1" />
                          Arquivo de áudio
                        </div>
                      )}
                      {reply.type === "image" && (
                        <div className="flex items-center text-sm text-green-600">
                          <Image className="w-4 h-4 mr-1" />
                          Arquivo de imagem
                        </div>
                      )}
                      {reply.type === "video" && (
                        <div className="flex items-center text-sm text-purple-600">
                          <Video className="w-4 h-4 mr-1" />
                          Arquivo de vídeo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
                Use ↑↓ para navegar, Enter/Tab para selecionar, Esc para fechar
              </div>
            </div>
          )}
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
      <div className="flex flex-wrap gap-2 mt-3">
        {QUICK_REPLIES.map((reply, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => insertQuickReply(reply)}
            className="text-xs rounded-full bg-gray-100 text-educhat-medium hover:bg-gray-200 border-0"
          >
            {reply}
          </Button>
        ))}
      </div>
    </div>
  );
}
