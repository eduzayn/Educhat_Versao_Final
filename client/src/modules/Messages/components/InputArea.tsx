import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/ui/popover';
import { useSendMessage } from '@/shared/lib/hooks/useMessages';
import { useSendAudioMessage } from '@/shared/lib/hooks/useAudioMessage';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useChatStore } from '@/shared/store/store/chatStore';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { AudioRecorder } from './AudioRecorder';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const QUICK_REPLIES = [
  'Obrigado pelo contato!',
  'Posso te ajudar com mais alguma coisa?',
  'Agende uma conversa'
];

// Emojis populares para reações rápidas
const QUICK_EMOJIS = [
  '👍', '❤️', '😊', '😂', '😢', '😮', '😡', '🎉'
];

export function InputArea() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { activeConversation } = useChatStore();
  const { sendTypingIndicator } = useWebSocket();
  const sendMessageMutation = useSendMessage();
  const sendAudioMutation = useSendAudioMessage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Mutation para enviar reação rápida
  const sendQuickReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!activeConversation?.contact.phone) {
        throw new Error("Número do contato não disponível");
      }

      const response = await apiRequest("POST", "/api/zapi/send-reaction", {
        phone: activeConversation.contact.phone,
        emoji: emoji
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
    }
  });

  const handleQuickReaction = (emoji: string) => {
    sendQuickReactionMutation.mutate(emoji);
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
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
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-3 bottom-3 p-1 text-educhat-medium hover:text-educhat-blue"
                disabled={sendQuickReactionMutation.isPending}
              >
                {sendQuickReactionMutation.isPending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                ) : (
                  <Smile className="w-5 h-5" />
                )}
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Emojis</h4>
                  {activeConversation?.contact.phone && (
                    <span className="text-xs text-gray-500">
                      Clique para inserir ou enviar reação
                    </span>
                  )}
                </div>
                
                {/* Emojis rápidos */}
                <div className="grid grid-cols-8 gap-2">
                  {QUICK_EMOJIS.map((emoji, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertEmoji(emoji)}
                        className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                        title={`Inserir ${emoji} no texto`}
                      >
                        {emoji}
                      </Button>
                      {activeConversation?.contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickReaction(emoji)}
                          className="h-6 w-8 p-0 text-xs text-blue-600 hover:bg-blue-50"
                          title={`Enviar reação ${emoji}`}
                          disabled={sendQuickReactionMutation.isPending}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {!activeConversation?.contact.phone && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 text-center">
                    Reações disponíveis apenas para contatos do WhatsApp
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
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