import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { useMessageQueue } from '@/shared/lib/hooks/useMessageQueue';
import { useMediaRecorder } from '@/shared/lib/hooks/useMediaRecorder';

interface MessageInputProps {
  conversationId: number;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export function MessageInput({ conversationId, disabled, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueMessage } = useMessageQueue(conversationId);
  const { startRecording, stopRecording } = useMediaRecorder();

  // Handler para envio de mensagem de texto
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;
    
    try {
      await enqueueMessage(message.trim(), 'text');
      setMessage('');
      if (onTyping) onTyping(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [message, enqueueMessage, onTyping]);

  // Handler para envio de arquivos
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const messageType = file.type.startsWith('image/') ? 'image' : 'document';
      await enqueueMessage(file.name, messageType, file);
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    } finally {
      // Limpar input para permitir enviar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [enqueueMessage]);

  // Handler para gravação de áudio
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });
        await enqueueMessage('Áudio', 'audio', file);
      }
      setIsRecording(false);
    } else {
      await startRecording();
      setIsRecording(true);
    }
  }, [isRecording, startRecording, stopRecording, enqueueMessage]);

  // Handler para tecla Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="flex items-end gap-2 p-4 bg-white border-t">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (onTyping) onTyping(true);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={disabled}
          className="min-h-[44px] max-h-[120px]"
          rows={1}
        />
      </div>

      {message.trim() ? (
        <Button
          variant="default"
          size="icon"
          onClick={handleSendMessage}
          disabled={disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant={isRecording ? 'destructive' : 'default'}
          size="icon"
          onClick={handleToggleRecording}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
} 