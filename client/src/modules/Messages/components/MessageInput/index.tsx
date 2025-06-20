import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useMessageSender } from './hooks/useMessageSender';
import { useQuickReplies, useIncrementQuickReplyUsage } from '@/shared/lib/hooks/useQuickReplies';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Send, Mic, StickyNote, Smile } from 'lucide-react';
import { AudioRecorder, AudioRecorderRef } from '@/modules/Messages/components/AudioRecorder/AudioRecorder';
import { QuickReplyDropdown } from './QuickReplyDropdown';
import { MediaAttachmentModal } from '@/modules/Messages/components/MediaAttachmentModal';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { QuickReply } from '@shared/schema';

// Lista de emojis frequentes
const FREQUENT_EMOJIS = [
  '😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘',
  '😂', '🤣', '😭', '😢', '😅', '😉', '😌', '😔',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🔥',
  '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍'
];

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [filteredReplies, setFilteredReplies] = useState<QuickReply[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<string>('');
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [isSendingBlocked, setIsSendingBlocked] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { data: quickReplies = [] } = useQuickReplies();
  const incrementUsageMutation = useIncrementQuickReplyUsage();
  const { toast } = useToast();

  const { isLoading, isUploading, sendTextMessage, uploadFile, shareLink, sendAudio } = useMessageSender({
    conversationId,
    onSendMessage,
  });

  // Memoize quickReplies to prevent unnecessary re-renders
  const memoizedQuickReplies = useMemo(() => quickReplies, [quickReplies.length]);

  // Buscar respostas rápidas baseadas no texto digitado
  useEffect(() => {
    if (message.startsWith('/')) {
      const query = message.slice(1).toLowerCase();
      if (query.length > 0) {
        const filtered = memoizedQuickReplies.filter(qr => 
          qr.title.toLowerCase().includes(query) ||
          qr.shortcut?.toLowerCase().includes(query) ||
          qr.content?.toLowerCase().includes(query)
        );
        setFilteredReplies(filtered);
        setShowQuickReplies(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setFilteredReplies(memoizedQuickReplies.slice(0, 10));
        setShowQuickReplies(true);
        setSelectedIndex(0);
      }
    } else {
      setShowQuickReplies(false);
      setFilteredReplies([]);
    }
  }, [message, memoizedQuickReplies]);

  const selectQuickReply = (reply: QuickReply) => {
    if (reply.type === 'text') {
      setMessage(reply.content || reply.title);
    }
    setShowQuickReplies(false);
    setFilteredReplies([]);
    
    // Incrementar contador de uso
    incrementUsageMutation.mutate(reply.id);
    
    // Focar no textarea
    textAreaRef.current?.focus();
  };

  // Proteção contra duplicação otimizada - reduzida para resposta instantânea
  const isDuplicateMessage = useCallback((content: string) => {
    const now = Date.now();
    const timeDiff = now - lastSentTime;
    const DUPLICATE_THRESHOLD_MS = 50; // Reduzido para 50ms para resposta instantânea
    
    return (
      content.trim() === lastSentMessage.trim() && 
      timeDiff < DUPLICATE_THRESHOLD_MS
    );
  }, [lastSentMessage, lastSentTime]);

  const handleSendMessage = async () => {
    const messageContent = message.trim();
    if (!messageContent) return;
    
    // Verificar se já está bloqueado ou é uma mensagem duplicada
    if (isSendingBlocked) {
      console.warn('Envio bloqueado - aguarde o anterior completar');
      return;
    }

    if (isDuplicateMessage(messageContent)) {
      console.warn('Tentativa de envio duplicado bloqueada:', messageContent);
      return;
    }

    // RENDERIZAÇÃO OTIMISTA: Limpar campo IMEDIATAMENTE para feedback visual instantâneo
    setMessage("");
    
    // Bloquear envios temporariamente
    setIsSendingBlocked(true);
    
    // Registrar o envio para evitar duplicatas
    setLastSentMessage(messageContent);
    setLastSentTime(Date.now());
    
    try {
      if (isInternalNote) {
        // Para notas internas, usar sistema otimista também
        await sendTextMessage(messageContent, true);
        setIsInternalNote(false);
      } else {
        // Envio otimista de mensagem regular
        await sendTextMessage(messageContent, false);
      }
      
      // Callback de sucesso
      onSendMessage?.();
    } catch (error) {
      // Em caso de erro, restaurar mensagem no campo
      console.error('Erro no envio:', error);
      setMessage(messageContent);
    } finally {
      // Desbloquear imediatamente após envio - sem delay
      setTimeout(() => {
        setIsSendingBlocked(false);
      }, 25);
    }
  };



  const handleFileUpload = async (file: File, caption?: string) => {
    await uploadFile(file, caption);
  };

  const handleLinkShare = async (url: string, caption?: string) => {
    await shareLink(url, caption);
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    await sendAudio(audioBlob, duration);
    setShowAudioRecorder(false);
  };

  const handleMicClick = () => {
    if (showAudioRecorder) {
      setShowAudioRecorder(false);
    } else {
      setShowAudioRecorder(true);
    }
  };

  const handleAudioCancel = () => {
    setShowAudioRecorder(false);
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textAreaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showQuickReplies && filteredReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredReplies.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredReplies.length) % filteredReplies.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectQuickReply(filteredReplies[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickReplies(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 relative">
      {/* Quick Reply Dropdown */}
      <QuickReplyDropdown
        visible={showQuickReplies}
        filteredReplies={filteredReplies}
        onSelect={selectQuickReply}
        selectedIndex={selectedIndex}
      />

      {/* Audio Recorder - posicionado acima do textarea */}
      {showAudioRecorder && (
        <div className="mb-3">
          <AudioRecorder
            ref={audioRecorderRef}
            onSendAudio={handleSendAudio}
            onCancel={handleAudioCancel}
            autoStart={true}
          />
        </div>
      )}

      <div className="flex items-end gap-3">
        <MediaAttachmentModal
          onFileUpload={handleFileUpload}
          onLinkShare={handleLinkShare}
          isUploading={isUploading}
        />

        <div className="flex-1">
          {isInternalNote && (
            <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" />
              <span className="font-medium">Modo Nota Interna - Visível apenas para a equipe</span>
            </div>
          )}
          <Textarea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternalNote ? "Digite sua nota interna..." : "Digite sua mensagem ou use / para respostas rápidas..."}
            className={`min-h-[40px] max-h-[120px] resize-none ${isInternalNote ? 'border-amber-300 bg-amber-50' : ''}`}
            aria-label="Campo de mensagem"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Adicionar emoji"
                title="Adicionar emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Emojis frequentes</h4>
                <div className="grid grid-cols-8 gap-1">
                  {FREQUENT_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-muted"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInternalNote(!isInternalNote)}
            className={`${isInternalNote ? 'bg-amber-100 text-amber-600' : ''}`}
            aria-label="Nota interna"
            title={isInternalNote ? "Voltar para mensagem normal" : "Criar nota interna"}
          >
            <StickyNote className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMicClick}
            className={`${showAudioRecorder ? 'bg-red-100 text-red-600' : ''}`}
            aria-label="Gravar áudio"
          >
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || isSendingBlocked}
            size="sm"
            aria-label={isInternalNote ? "Criar nota interna" : "Enviar mensagem"}
            className={isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {isInternalNote ? <StickyNote className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}