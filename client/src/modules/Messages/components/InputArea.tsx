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
import { DEFAULT_QUICK_REPLIES } from "../../../shared/constants/quickReplies";
import { formatDuration } from "../../../shared/lib/utils/format";
import { QuickReplyList } from "./QuickReplyList";

export function InputArea() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState("");
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { activeConversation } = useChatStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customQuickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ["/api/quick-replies"],
    enabled: true,
  });

  const allQuickReplies = Array.from(
    new Set([
      ...DEFAULT_QUICK_REPLIES,
      ...(customQuickReplies || []).map((qr: QuickReply) => qr.content),
    ]),
  );

  const filteredQuickReplies = allQuickReplies.filter((reply) =>
    reply?.toLowerCase().includes(quickReplyFilter.toLowerCase()),
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; isInternalNote: boolean }) => {
      if (!activeConversation?.id) throw new Error("Nenhuma conversa ativa");
      const response = await fetch(
        `/api/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error("Erro ao enviar mensagem");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setIsInternalNote(false);
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversation?.contact.phone)
        throw new Error("Número do contato não disponível");
      const response = await fetch("/api/zapi/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeConversation.contact.phone,
          message: content,
          conversationId: activeConversation.id,
        }),
      });
      if (!response.ok) throw new Error("Erro ao enviar via WhatsApp");
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
      toast({
        title: "Erro no WhatsApp",
        description: "Não foi possível enviar via WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendAudioMutation = useMutation({
    mutationFn: async ({
      blob,
      duration,
    }: {
      blob: Blob;
      duration: number;
    }) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id)
        throw new Error("Dados da conversa não disponíveis");
      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("duration", duration.toString());
      formData.append("audio", blob, "audio.webm");
      const response = await fetch("/api/zapi/send-audio", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Erro ao enviar áudio");
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
      toast({
        title: "Erro ao enviar áudio",
        description: "Não foi possível enviar o áudio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (
      sendMessageMutation.isPending ||
      sendWhatsAppMutation.isPending ||
      !message.trim() ||
      !activeConversation
    )
      return;
    const messageContent = message.trim();
    if (isInternalNote) {
      sendMessageMutation.mutate({
        content: messageContent,
        isInternalNote: true,
      });
    } else {
      if (activeConversation.contact.phone) {
        sendWhatsAppMutation.mutate(messageContent);
      } else {
        sendMessageMutation.mutate({
          content: messageContent,
          isInternalNote: false,
        });
      }
    }
  };

  const selectQuickReply = (content: string) => {
    setMessage(content);
    setShowQuickReplies(false);
    setQuickReplyFilter("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/" && message === "") {
      e.preventDefault();
      setShowQuickReplies(true);
      setQuickReplyFilter("");
    } else if (e.key === "Escape" && showQuickReplies) {
      setShowQuickReplies(false);
      setQuickReplyFilter("");
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showQuickReplies && filteredQuickReplies[selectedQuickReplyIndex]) {
        selectQuickReply(filteredQuickReplies[selectedQuickReplyIndex]);
      } else {
        handleSendMessage();
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro ao acessar microfone",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setShowAudioRecorder(false);
  };

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      setCurrentAudio(audio);
      audio.play();
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
    }
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  const sendAudio = () => {
    if (audioBlob) {
      sendAudioMutation.mutate({
        blob: audioBlob,
        duration: recordingTime,
      });
    }
  };

  return (
    <div className="relative p-4 border-t bg-white dark:bg-gray-900">
      {showQuickReplies && (
        <QuickReplyList
          isOpen={showQuickReplies}
          onSelect={selectQuickReply}
          onClose={() => setShowQuickReplies(false)}
          filter={quickReplyFilter}
          selectedIndex={selectedQuickReplyIndex}
          onIndexChange={setSelectedQuickReplyIndex}
        />
      )}

      {showAudioRecorder && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
                )}>
                </div>
                <span className="text-sm font-medium">
                  {formatDuration(recordingTime)}
                </span>
              </div>
              
              {audioBlob && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPlaying ? pauseAudio : playAudio}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isRecording ? (
                <Button size="sm" onClick={stopRecording} variant="destructive">
                  <Square className="h-4 w-4" />
                </Button>
              ) : audioBlob ? (
                <>
                  <Button size="sm" onClick={sendAudio} disabled={sendAudioMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={cancelRecording} variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={startRecording}>
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternalNote ? "Escreva uma nota interna..." : "Digite sua mensagem..."}
            className={cn(
              "min-h-[60px] max-h-32 resize-none",
              isInternalNote && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
            )}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isInternalNote ? "default" : "outline"}
                  onClick={() => setIsInternalNote(!isInternalNote)}
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInternalNote ? "Modo mensagem normal" : "Modo nota interna"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gravar áudio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Respostas rápidas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleSendMessage}
            disabled={
              !message.trim() ||
              sendMessageMutation.isPending ||
              sendWhatsAppMutation.isPending
            }
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
