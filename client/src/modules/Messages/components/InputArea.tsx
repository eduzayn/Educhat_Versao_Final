import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, MicOff, X, Image as ImageIcon, Video, FileText, Link as LinkIcon, ArrowUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { EmojiPicker } from "@/shared/ui/emoji-picker"; // Comentado temporariamente
import { AudioRecorder } from "./AudioRecorder";
import { ImageUpload } from "./ImageUpload";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { useSendMessage } from "@/shared/lib/hooks/useMessages";
import { useAudioMessage } from "@/shared/lib/hooks/useAudioMessage";
import { useImageMessage } from "@/shared/lib/hooks/useImageMessage";
import { useFileMessage } from "@/shared/lib/hooks/useFileMessage";
import { useVideoMessage } from "@/shared/lib/hooks/useVideoMessage";
import { useWebSocket } from "@/shared/lib/hooks/useWebSocket";
import { useChatStore } from "@/shared/store/chatStore";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { QuickReply } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface InputAreaProps {
  activeConversation: any;
}

export function InputArea({ activeConversation }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; content: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Hooks padronizados para diferentes tipos de mídia
  const sendImageMutation = useImageMessage({ 
    conversationId: activeConversation?.id || 0, 
    contactPhone: activeConversation?.contact?.phone || '' 
  });

  const sendFileMutation = useFileMessage({ 
    conversationId: activeConversation?.id || 0, 
    contactPhone: activeConversation?.contact?.phone || '' 
  });

  const sendVideoMutation = useVideoMessage({ 
    conversationId: activeConversation?.id || 0, 
    contactPhone: activeConversation?.contact?.phone || '' 
  });

  const sendAudioMutation = useAudioMessage({ 
    conversationId: activeConversation?.id || 0, 
    contactPhone: activeConversation?.contact?.phone || '' 
  });

  // Hook para envio de mensagens de texto
  const sendMessageMutation = useSendMessage();

  // Escutar evento de resposta a mensagem
  useEffect(() => {
    const handleReplyEvent = (event: CustomEvent) => {
      setReplyingTo(event.detail);
      textareaRef.current?.focus();
    };

    window.addEventListener('replyToMessage', handleReplyEvent as EventListener);
    return () => window.removeEventListener('replyToMessage', handleReplyEvent as EventListener);
  }, []);

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation?.id) return;

    sendMessageMutation.mutate({
      conversationId: activeConversation.id,
      message: {
        content: message.trim(),
        messageType: 'text',
        direction: 'outbound',
        sentAt: new Date().toISOString(),
        isInternalNote: false,
        replyToMessageId: replyingTo?.messageId || null,
      },
      contact: activeConversation.contact,
    });

    setMessage("");
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (type: 'image' | 'video' | 'document') => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'image') {
      input.accept = 'image/*';
    } else if (type === 'video') {
      input.accept = 'video/*';
    } else {
      input.accept = '*/*';
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (type === "image") {
          sendImageMutation.mutate({ file });
        } else if (type === "video") {
          sendVideoMutation.mutate({ file });
        } else if (type === "document") {
          sendFileMutation.mutate({ file });
        }
        setIsAttachmentOpen(false);
      }
    };

    input.click();
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation?.contact?.phone) {
      console.error("Telefone do contato não disponível");
      return;
    }

    const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
      type: audioBlob.type || 'audio/webm',
    });

    sendAudioMutation.mutate({ 
      file: audioFile, 
      duration 
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Indicador de resposta */}
      {replyingTo && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Respondendo para:</p>
              <p className="text-sm text-gray-700 truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Botão de anexo */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Menu de anexos */}
          {isAttachmentOpen && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-50">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload('image')}
                  className="justify-start"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Imagem
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload('video')}
                  className="justify-start"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Vídeo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload('document')}
                  className="justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Documento
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Campo de texto */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-32 resize-none pr-10"
            rows={1}
          />
        </div>

        {/* Botão de emoji */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Smile className="w-5 h-5" />
          </Button>

          {isEmojiOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-50 bg-white border rounded-lg shadow-lg p-4">
              <div className="grid grid-cols-8 gap-2">
                {['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '👍', '👎', '❤️', '🔥', '⭐', '✅', '❌', '🎉', '💯'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleEmojiSelect(emoji);
                      setIsEmojiOpen(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gravador de áudio */}
        <AudioRecorder
          onSendAudio={handleSendAudio}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />

        {/* Botão de enviar */}
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}