import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { useSendMessage } from '@/shared/lib/hooks/useMessages';
import { useSendAudioMessage } from '@/shared/lib/hooks/useAudioMessage';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useChatStore } from '@/shared/store/store/chatStore';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { AudioRecorder } from './AudioRecorder';
import { cn } from '@/lib/utils';

const QUICK_REPLIES = [
  'Obrigado pelo contato!',
  'Posso te ajudar com mais alguma coisa?',
  'Agende uma conversa'
];

export function InputArea() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { activeConversation } = useChatStore();
  const { sendTypingIndicator } = useWebSocket();
  const sendMessageMutation = useSendMessage();
  const sendAudioMutation = useSendAudioMessage();
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleTyping = (value: string) => {
    setMessage(value);
    
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
    setMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation.id, false);
    }

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: messageContent,
          isFromContact: false,
          messageType: 'text',
        },
        contact: activeConversation.contact,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertQuickReply = (reply: string) => {
    setMessage(reply);
    textareaRef.current?.focus();
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
        title: 'Áudio enviado',
        description: 'Sua mensagem de áudio foi enviada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar áudio',
        description: 'Falha ao enviar mensagem de áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelAudio = () => {
    setShowAudioRecorder(false);
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
            onSendAudio={handleSendAudio}
            onCancel={handleCancelAudio}
          />
        </div>
      )}
      
      {/* Interface de digitação sempre visível */}
      <div className="flex items-end space-x-3">
        <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
          <Paperclip className="w-5 h-5" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAudioRecorder(!showAudioRecorder)}
          className={cn(
            "p-2 text-educhat-medium hover:text-educhat-blue",
            showAudioRecorder && "bg-educhat-primary text-white"
          )}
        >
          <Mic className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[44px] max-h-[120px] resize-none pr-12 border-gray-300 focus:ring-2 focus:ring-educhat-primary focus:border-transparent"
            rows={1}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-3 bottom-3 p-1 text-educhat-medium hover:text-educhat-blue"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>
        
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className={cn(
            "bg-educhat-primary hover:bg-educhat-secondary text-white p-3 rounded-xl transition-colors",
            sendMessageMutation.isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          {sendMessageMutation.isPending ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-5 h-5" />
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