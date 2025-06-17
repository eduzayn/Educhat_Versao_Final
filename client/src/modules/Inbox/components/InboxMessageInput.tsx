import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Send, Mic, MicOff, Square, Paperclip } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface QuickReply {
  id: number;
  title: string;
  content: string;
  type: string;
  shortcut?: string;
  category?: string;
  isActive: boolean;
}

interface InboxMessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function InboxMessageInput({ conversationId, onSendMessage }: InboxMessageInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Buscar respostas rápidas
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['/api/quick-replies/my-replies'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies/my-replies');
      if (!response.ok) throw new Error('Failed to fetch quick replies');
      return response.json() as Promise<QuickReply[]>;
    },
  });

  // Filtrar respostas rápidas
  const filteredQuickReplies = quickReplies.filter((qr: QuickReply) => {
    if (!qr.isActive) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        qr.title.toLowerCase().includes(query) ||
        (qr.content || '').toLowerCase().includes(query) ||
        (qr.shortcut || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleQuickReplyDetection = (newMessage: string) => {
    if (newMessage.startsWith('/') && newMessage.length > 1) {
      const query = newMessage.slice(1);
      setSearchQuery(query);
      setShowQuickReplies(true);
      setSelectedIndex(0);
    } else {
      setShowQuickReplies(false);
      setSearchQuery('');
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    handleQuickReplyDetection(value);
  };

  const selectQuickReply = (quickReply: QuickReply) => {
    setMessage(quickReply.content);
    setShowQuickReplies(false);
    setSearchQuery('');
  };

  const handleSendTextMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.trim(),
          type: 'text',
        }),
      });

      if (response.ok) {
        setMessage('');
        setShowQuickReplies(false);
        setSearchQuery('');
        onSendMessage?.();
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso.",
        });
      } else {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        if (recordingTime > 0) {
          await sendAudioMessage(audioBlob, recordingTime);
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 300) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendAudioMessage = async (audioBlob: Blob, duration: number) => {
    const formData = new FormData();
    formData.append('file', new File([audioBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav' }));
    formData.append('caption', `Áudio (${Math.floor(duration)}s)`);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSendMessage?.();
        toast({
          title: "Áudio enviado",
          description: "Sua mensagem de áudio foi enviada com sucesso.",
        });
      } else {
        throw new Error('Falha ao enviar áudio');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar áudio",
        description: "Não foi possível enviar o áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showQuickReplies && filteredQuickReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredQuickReplies.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredQuickReplies.length - 1
        );
        return;
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const selectedReply = filteredQuickReplies[selectedIndex];
        if (selectedReply) {
          selectQuickReply(selectedReply);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowQuickReplies(false);
        setSearchQuery('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSendMessage?.();
        toast({
          title: "Arquivo enviado",
          description: `${file.name} foi enviado com sucesso.`,
        });
      } else {
        throw new Error('Falha ao enviar arquivo');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar arquivo",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
      />

      {/* Quick Replies Popup */}
      {showQuickReplies && filteredQuickReplies.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            Respostas rápidas disponíveis:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {filteredQuickReplies.map((reply, index) => (
              <div
                key={reply.id}
                className={`p-2 rounded cursor-pointer flex items-start gap-2 ${
                  index === selectedIndex
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100 dark:hover:bg-blue-900"
                }`}
                onClick={() => selectQuickReply(reply)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{reply.title}</div>
                  <div className="text-xs opacity-75 truncate">{reply.content}</div>
                </div>
                {reply.shortcut && (
                  <div className="text-xs bg-blue-200 dark:bg-blue-800 px-1 rounded">
                    {reply.shortcut}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
            Use ↑↓ para navegar, Enter/Tab para selecionar, Esc para fechar
          </p>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 font-mono">{formatTime(recordingTime)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
                if (recordingIntervalRef.current) {
                  clearInterval(recordingIntervalRef.current);
                  recordingIntervalRef.current = null;
                }
                setIsRecording(false);
                setRecordingTime(0);
              }
            }}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <MicOff className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileSelect}
          className="mb-2"
          aria-label="Anexar arquivo"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Text area */}
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (use / para respostas rápidas)"
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isLoading}
            aria-label="Campo de mensagem"
            aria-multiline="true"
          />
        </div>

        {/* Voice recording button */}
        <Button
          variant="ghost"
          size="sm"
          className={`mb-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSendTextMessage}
          disabled={!message.trim() || isLoading}
          size="sm"
          className="mb-2"
          aria-label="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}