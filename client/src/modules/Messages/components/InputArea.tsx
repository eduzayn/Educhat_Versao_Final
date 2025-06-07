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
import { DEFAULT_QUICK_REPLIES } from "@/shared/constants/quickReplies";
import { formatDuration } from "@/shared/lib/utils/format";
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

  // restante permanece igual (áudio, renderização, componentes, etc.)
  // ...

  return (
    <div className="...">
      {/* componentes visuais e renderizações mantidos */}
      {showQuickReplies && (
        <QuickReplyList
          replies={filteredQuickReplies}
          selectedIndex={selectedQuickReplyIndex}
          onSelect={selectQuickReply}
        />
      )}
    </div>
  );
}
