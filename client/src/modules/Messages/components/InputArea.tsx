import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic, Image, Video, FileText, Link, Upload } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
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
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Mutation para enviar imagem
  const sendImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append('phone', activeConversation.contact.phone);
      formData.append('conversationId', activeConversation.id.toString());
      formData.append('image', file);

      const response = await fetch('/api/zapi/send-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar imagem');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso!",
      });
      setIsAttachmentOpen(false);
      
      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
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
    }
  });

  // Mutation para enviar vídeo
  const sendVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('🎥 Iniciando envio de vídeo:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        conversationId: activeConversation?.id,
        contactPhone: activeConversation?.contact.phone
      });

      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        console.error('❌ Dados da conversa não disponíveis');
        throw new Error("Dados da conversa não disponíveis");
      }

      try {
        const formData = new FormData();
        formData.append('phone', activeConversation.contact.phone);
        formData.append('conversationId', activeConversation.id.toString());
        formData.append('video', file);

        console.log('📤 Enviando FormData para servidor:', {
          phone: activeConversation.contact.phone,
          conversationId: activeConversation.id,
          fileName: file.name,
          fileSize: file.size
        });

        const response = await fetch('/api/zapi/send-video', {
          method: 'POST',
          body: formData,
          // Aumentar timeout para arquivos grandes
          signal: AbortSignal.timeout(180000), // 3 minutos
        });

        console.log('📥 Resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta do servidor:', errorText);
          throw new Error(`Erro ao enviar vídeo: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Vídeo enviado com sucesso:', result);
        return result;
      } catch (error) {
        console.error('💥 Erro no processo de envio:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Vídeo enviado",
        description: "Seu vídeo foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      
      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
        });
        // Força um refetch imediato
        queryClient.refetchQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar vídeo:", error);
      const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timeout'));
      toast({
        title: "Erro ao enviar vídeo",
        description: isTimeout 
          ? "O vídeo é muito grande. Arquivos maiores que 50MB podem demorar mais para enviar."
          : "Não foi possível enviar o vídeo. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para enviar documento
  const sendDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      console.log('📄 Iniciando envio de documento:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        phone: activeConversation.contact.phone,
        conversationId: activeConversation.id
      });

      const formData = new FormData();
      formData.append('phone', activeConversation.contact.phone);
      formData.append('conversationId', activeConversation.id.toString());
      formData.append('document', file);

      try {
        const response = await fetch('/api/zapi/send-document', {
          method: 'POST',
          body: formData,
        });

        console.log('📥 Resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const responseData = await response.json();
        console.log('📊 Dados da resposta:', responseData);

        if (!response.ok) {
          console.error('❌ Erro na resposta:', responseData);
          throw new Error(responseData.error || 'Erro ao enviar documento');
        }

        return responseData;
      } catch (error) {
        console.error('💥 Erro no processo de envio:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      
      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
        });
        // Força um refetch imediato
        queryClient.refetchQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
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
    }
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
        text: text
      });

      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Link enviado",
        description: "Seu link foi enviado com sucesso!",
      });
      setIsAttachmentOpen(false);
      setLinkUrl('');
      setLinkText('');
      
      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
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
    }
  });

  const handleFileSelect = (type: 'image' | 'video' | 'document') => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'image') {
      input.accept = 'image/*';
    } else if (type === 'video') {
      input.accept = 'video/*';
    } else if (type === 'document') {
      input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx';
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (type === 'image') {
          sendImageMutation.mutate(file);
        } else if (type === 'video') {
          sendVideoMutation.mutate(file);
        } else if (type === 'document') {
          sendDocumentMutation.mutate(file);
        }
      }
    };

    input.click();
  };

  const handleSendLink = () => {
    if (linkUrl.trim() && linkText.trim()) {
      sendLinkMutation.mutate({ url: linkUrl.trim(), text: linkText.trim() });
    } else {
      toast({
        title: "Dados incompletos",
        description: "Preencha a URL e o texto do link.",
        variant: "destructive",
      });
    }
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
        <Dialog open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-educhat-medium hover:text-educhat-blue"
              disabled={!activeConversation?.contact.phone}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="w-96">
            <DialogHeader>
              <DialogTitle>Enviar Anexo</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Botão para Imagem */}
              <Button
                onClick={() => handleFileSelect('image')}
                disabled={sendImageMutation.isPending}
                className="h-20 flex-col bg-blue-500 hover:bg-blue-600 text-white"
              >
                {sendImageMutation.isPending ? (
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Image className="w-8 h-8 mb-2" />
                    <span className="text-sm">Imagem</span>
                  </>
                )}
              </Button>

              {/* Botão para Vídeo */}
              <Button
                onClick={() => handleFileSelect('video')}
                disabled={sendVideoMutation.isPending}
                className="h-20 flex-col bg-red-500 hover:bg-red-600 text-white"
              >
                {sendVideoMutation.isPending ? (
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Video className="w-8 h-8 mb-2" />
                    <span className="text-sm">Vídeo</span>
                  </>
                )}
              </Button>

              {/* Botão para Documento */}
              <Button
                onClick={() => handleFileSelect('document')}
                disabled={sendDocumentMutation.isPending}
                className="h-20 flex-col bg-green-500 hover:bg-green-600 text-white"
              >
                {sendDocumentMutation.isPending ? (
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="text-sm">Documento</span>
                  </>
                )}
              </Button>

              {/* Botão para Link */}
              <Button
                onClick={() => {/* Abrirá seção de link */}}
                className="h-20 flex-col bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Link className="w-8 h-8 mb-2" />
                <span className="text-sm">Link</span>
              </Button>
            </div>

            {/* Seção para envio de link */}
            <div className="mt-6 space-y-3">
              <div>
                <Label htmlFor="linkUrl">URL do Link</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="linkText">Texto do Link</Label>
                <Input
                  id="linkText"
                  placeholder="Descrição do link"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleSendLink}
                disabled={!linkUrl.trim() || !linkText.trim() || sendLinkMutation.isPending}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                {sendLinkMutation.isPending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Enviar Link
              </Button>
            </div>

            {!activeConversation?.contact.phone && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 text-center">
                Anexos disponíveis apenas para contatos do WhatsApp
              </div>
            )}
          </DialogContent>
        </Dialog>
        
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