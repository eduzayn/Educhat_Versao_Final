import { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/ui/ui/button";
import { Textarea } from "@/shared/ui/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/ui/tooltip";
import {
  Send,
  Mic,
  MessageCircle,
  StickyNote,
  Play,
  Pause,
  Square,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuickReply } from "@shared/schema";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { AttachmentDialog } from "./AttachmentDialog";
import { useChatStore } from "@/shared/store/store/chatStore";
import { useToast } from "@/shared/lib/hooks/use-toast";

const QUICK_REPLIES = [
  "Obrigado pelo contato!",
  "Posso te ajudar com mais alguma coisa?",
  "Vou encaminhar sua solicitação para o setor responsável.",
  "Entendi sua situação, vamos resolver isso.",
  "Aguarde um momento, por favor.",
];

export function InputArea() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState("");
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { activeConversation } = useChatStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar respostas rápidas personalizadas
  const { data: customQuickReplies = [] } = useQuery({
    queryKey: ["/api/quick-replies"],
    enabled: true,
  });

  // Combinar respostas rápidas padrão com personalizadas
  const allQuickReplies = [...QUICK_REPLIES, ...customQuickReplies.map((qr: QuickReply) => qr.content)];

  // Filtrar respostas rápidas
  const filteredQuickReplies = allQuickReplies.filter((reply) =>
    reply.toLowerCase().includes(quickReplyFilter.toLowerCase())
  );

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; isInternalNote: boolean }) => {
      if (!activeConversation?.id) {
        throw new Error("Nenhuma conversa ativa");
      }

      return apiRequest(`/api/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setMessage("");
      setIsInternalNote(false);
      
      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar via WhatsApp (Z-API)
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversation?.contact.phone) {
        throw new Error("Número do contato não disponível");
      }

      const response = await fetch("/api/zapi/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: activeConversation.contact.phone,
          message: content,
          conversationId: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar via WhatsApp");
      }

      return response.json();
    },
    onSuccess: () => {
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar via WhatsApp:", error);
      toast({
        title: "Erro no WhatsApp",
        description: "Não foi possível enviar via WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar áudio
  const sendAudioMutation = useMutation({
    mutationFn: async ({ blob, duration }: { blob: Blob; duration: number }) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("duration", duration.toString());
      formData.append("audio", blob, "audio.webm");

      const response = await fetch("/api/zapi/send-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar áudio");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Áudio enviado",
        description: "Seu áudio foi enviado com sucesso!",
      });
      
      setAudioBlob(null);
      setRecordingTime(0);
      setShowAudioRecorder(false);

      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar áudio:", error);
      toast({
        title: "Erro ao enviar áudio",
        description: "Não foi possível enviar o áudio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Funções de digitação
  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (value.length === 0) {
      setShowQuickReplies(false);
      setQuickReplyFilter("");
      return;
    }

    if (value.startsWith("/")) {
      setShowQuickReplies(true);
      setQuickReplyFilter(value.substring(1));
      setSelectedQuickReplyIndex(0);
    } else {
      setShowQuickReplies(false);
    }

    // Simular digitação para outros usuários
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      if (showQuickReplies && filteredQuickReplies.length > 0) {
        selectQuickReply(filteredQuickReplies[selectedQuickReplyIndex]);
      } else {
        handleSendMessage();
      }
    }

    if (showQuickReplies) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) =>
          prev < filteredQuickReplies.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedQuickReplyIndex((prev) =>
          prev > 0 ? prev - 1 : filteredQuickReplies.length - 1
        );
      } else if (e.key === "Escape") {
        setShowQuickReplies(false);
      }
    }
  };

  const selectQuickReply = (quickReply: string) => {
    setMessage(quickReply);
    setShowQuickReplies(false);
    setQuickReplyFilter("");
    textareaRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation) return;

    const messageContent = message.trim();

    if (isInternalNote) {
      // Enviar como nota interna
      sendMessageMutation.mutate({
        content: messageContent,
        isInternalNote: true,
      });
    } else {
      // Para contatos do WhatsApp, enviar via Z-API
      if (activeConversation.contact.phone) {
        sendWhatsAppMutation.mutate(messageContent);
      } else {
        // Para outros canais, enviar via API normal
        sendMessageMutation.mutate({
          content: messageContent,
          isInternalNote: false,
        });
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Funções de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      chunksRef.current = [];
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      setCurrentAudio(audio);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      
      audio.play();
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  };

  const sendAudio = () => {
    if (audioBlob) {
      sendAudioMutation.mutate({
        blob: audioBlob,
        duration: recordingTime,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!activeConversation) {
    return (
      <div className="p-4 text-center text-gray-500">
        Selecione uma conversa para começar a digitar
      </div>
    );
  }

  return (
    <div className="border-t bg-white dark:bg-gray-900 p-4 space-y-4">
      {/* Gravador de áudio */}
      {showAudioRecorder && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isRecording && !isPaused ? "bg-red-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className="text-sm font-medium">
                {isRecording ? (isPaused ? "Pausado" : "Gravando") : "Pronto para gravar"}
              </span>
              <span className="text-sm text-gray-600">{formatTime(recordingTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} size="sm" className="bg-red-500 hover:bg-red-600">
                <Mic className="w-4 h-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <>
                {!isPaused ? (
                  <Button onClick={pauseRecording} size="sm" variant="outline">
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={resumeRecording} size="sm" variant="outline">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={stopRecording} size="sm" variant="outline">
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}

            {audioBlob && (
              <>
                <Button
                  onClick={isPlaying ? stopAudio : playAudio}
                  size="sm"
                  variant="outline"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button onClick={deleteAudio} size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={sendAudio}
                  disabled={sendAudioMutation.isPending}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  {sendAudioMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {showQuickReplies && filteredQuickReplies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredQuickReplies.slice(0, 5).map((reply, index) => (
            <button
              key={index}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0",
                index === selectedQuickReplyIndex && "bg-educhat-primary/10"
              )}
              onClick={() => selectQuickReply(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Indicador de modo nota interna */}
      {isInternalNote && (
        <div className="mb-2 flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md text-xs text-amber-700 dark:text-amber-400 relative z-50 shadow-sm">
          <StickyNote className="h-3 w-3" />
          <span className="font-medium">Modo: Nota Interna (apenas equipe)</span>
        </div>
      )}

      {/* Interface de digitação */}
      <div className="flex items-end space-x-3">
        {/* Componente de anexos isolado */}
        <AttachmentDialog disabled={sendMessageMutation.isPending || sendWhatsAppMutation.isPending} />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAudioRecorder(!showAudioRecorder)}
          className={cn(
            "p-2.5 text-educhat-medium hover:text-educhat-blue",
            showAudioRecorder && "bg-educhat-primary text-white",
          )}
        >
          <Mic className="w-5.5 h-5.5" />
        </Button>

        {/* Componente de emojis */}
        <EmojiReactionPicker onEmojiInsert={insertEmoji} />

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
          
          {/* Botões de toggle entre Mensagem e Nota Interna */}
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
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mensagem normal</p>
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
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nota interna (apenas equipe)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending || sendWhatsAppMutation.isPending}
          className="bg-educhat-primary hover:bg-educhat-blue text-white px-6 py-3 h-12"
        >
          {(sendMessageMutation.isPending || sendWhatsAppMutation.isPending) ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}