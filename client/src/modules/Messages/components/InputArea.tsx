import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic, Image, Video, FileText, Link, Upload, Zap, MessageSquare, StickyNote } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { useSendMessage } from '@/shared/lib/hooks/useMessages';
import { useSendAudioMessage } from '@/shared/lib/hooks/useAudioMessage';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useChatStore } from '@/shared/store/store/chatStore';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { AudioRecorder } from './AudioRecorder';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { QuickReply } from '@shared/schema';

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
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { activeConversation } = useChatStore();
  const { sendTypingIndicator } = useWebSocket();
  const sendMessageMutation = useSendMessage();
  const sendAudioMutation = useSendAudioMessage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar respostas rápidas
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['/api/quick-replies'],
    enabled: showQuickReplies && message.includes('/')
  });

  // Query para buscar usuário atual (para notas internas)
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 10 // 10 minutos
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQuickReplies) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const filteredReplies = getFilteredQuickReplies();
          setSelectedQuickReplyIndex(prev => 
            prev < filteredReplies.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const filteredReplies = getFilteredQuickReplies();
          setSelectedQuickReplyIndex(prev => 
            prev > 0 ? prev - 1 : filteredReplies.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const filteredReplies = getFilteredQuickReplies();
          if (filteredReplies[selectedQuickReplyIndex]) {
            selectQuickReply(filteredReplies[selectedQuickReplyIndex]);
          }
        } else if (e.key === 'Escape') {
          setShowQuickReplies(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickReplies, selectedQuickReplyIndex, message]);

  const getFilteredQuickReplies = () => {
    const searchTerm = quickReplyFilter.toLowerCase();
    const customReplies = quickReplies.filter((reply: QuickReply) => 
      reply.title.toLowerCase().includes(searchTerm) ||
      (reply.content && reply.content.toLowerCase().includes(searchTerm)) ||
      (reply.category && reply.category.toLowerCase().includes(searchTerm))
    );
    
    const defaultReplies = QUICK_REPLIES
      .filter(reply => reply.toLowerCase().includes(searchTerm))
      .map(content => ({ id: `default-${content}`, title: content, content, type: 'text' as const }));
    
    return [...customReplies, ...defaultReplies];
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Verificar se está digitando comando de resposta rápida
    const lastSlashIndex = value.lastIndexOf('/');
    if (lastSlashIndex !== -1 && lastSlashIndex === value.length - 1) {
      setShowQuickReplies(true);
      setQuickReplyFilter('');
      setSelectedQuickReplyIndex(0);
    } else if (lastSlashIndex !== -1 && lastSlashIndex < value.length - 1) {
      const filter = value.substring(lastSlashIndex + 1);
      setQuickReplyFilter(filter);
      setShowQuickReplies(true);
      setSelectedQuickReplyIndex(0);
    } else {
      setShowQuickReplies(false);
    }

    // Indicador de digitação
    if (!isTyping && activeConversation) {
      setIsTyping(true);
      sendTypingIndicator(activeConversation.id, true);
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar indicador após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (activeConversation) {
        sendTypingIndicator(activeConversation.id, false);
      }
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    try {
      if (isInternalNote) {
        // Enviar nota interna com nome do usuário atual
        const authorName = currentUser?.displayName || currentUser?.username || 'Usuário';
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: message.trim(),
            isFromContact: false,
            messageType: 'text',
            isInternalNote: true,
            authorName: authorName,
          },
          contact: activeConversation.contact,
        });
      } else {
        // Enviar mensagem normal
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: message.trim(),
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }
      
      setMessage('');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      if (activeConversation) {
        sendTypingIndicator(activeConversation.id, false);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return; // Allow new line
      } else {
        e.preventDefault();
        if (showQuickReplies) {
          const filteredReplies = getFilteredQuickReplies();
          if (filteredReplies[selectedQuickReplyIndex]) {
            selectQuickReply(filteredReplies[selectedQuickReplyIndex]);
          }
        } else {
          handleSendMessage();
        }
      }
    }
  };

  const handleSendTextWithAttachment = async (quickReply: QuickReply) => {
    if (!activeConversation) return;
    
    try {
      // Enviar o texto primeiro
      if (quickReply.content && quickReply.content.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.content,
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }

      // Se há anexo de mídia, enviar como segunda mensagem
      if (quickReply.fileUrl && quickReply.mimeType) {
        let attachmentType: 'image' | 'video' | 'document' = 'document';
        
        if (quickReply.mimeType.startsWith('image/')) {
          attachmentType = 'image';
        } else if (quickReply.mimeType.startsWith('video/')) {
          attachmentType = 'video';
        }

        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.fileUrl,
            isFromContact: false,
            messageType: attachmentType,
          },
          contact: activeConversation.contact,
        });
      }

      setMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem com anexo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const selectQuickReply = (quickReply: QuickReply) => {
    const lastSlashIndex = message.lastIndexOf('/');
    const beforeSlash = message.substring(0, lastSlashIndex);
    
    let content = '';
    if (quickReply.type === 'text') {
      if (quickReply.fileUrl) {
        // Texto com anexo - enviar diretamente
        handleSendTextWithAttachment(quickReply);
        return;
      } else {
        // Texto simples - inserir no campo
        content = quickReply.content || '';
      }
    } else if (quickReply.type === 'audio' && quickReply.fileUrl) {
      // Para áudio, enviar diretamente
      handleSendQuickReplyAudio(quickReply);
      return;
    } else if (quickReply.type === 'image' && quickReply.fileUrl) {
      // Para imagem, enviar diretamente
      handleSendImage(quickReply);
      return;
    } else if (quickReply.type === 'video' && quickReply.fileUrl) {
      // Para vídeo, enviar diretamente
      handleSendVideo(quickReply);
      return;
    } else if (quickReply.type === 'document' && quickReply.fileUrl) {
      // Para documento, enviar diretamente
      handleSendDocument(quickReply);
      return;
    }
    
    setMessage(beforeSlash + content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const handleSendQuickReplyAudio = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;
    
    try {
      // Enviar o áudio primeiro
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: 'audio',
        },
        contact: activeConversation.contact,
      });

      // Se há texto adicional, enviar como segunda mensagem
      if (quickReply.additionalText && quickReply.additionalText.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.additionalText,
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }

      setMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSendImage = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;
    
    try {
      // Enviar a imagem primeiro
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: 'image',
        },
        contact: activeConversation.contact,
      });

      // Se há texto adicional, enviar como segunda mensagem
      if (quickReply.additionalText && quickReply.additionalText.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.additionalText,
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }

      setMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar imagem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSendVideo = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;
    
    try {
      // Enviar o vídeo primeiro
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: 'video',
        },
        contact: activeConversation.contact,
      });

      // Se há texto adicional, enviar como segunda mensagem
      if (quickReply.additionalText && quickReply.additionalText.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.additionalText,
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }

      setMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar vídeo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSendDocument = async (quickReply: QuickReply) => {
    if (!activeConversation || !quickReply.fileUrl) return;
    
    try {
      // Enviar o documento primeiro
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: quickReply.fileUrl,
          isFromContact: false,
          messageType: 'document',
        },
        contact: activeConversation.contact,
      });

      // Se há texto adicional, enviar como segunda mensagem
      if (quickReply.additionalText && quickReply.additionalText.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversation.id,
          message: {
            content: quickReply.additionalText,
            isFromContact: false,
            messageType: 'text',
          },
          contact: activeConversation.contact,
        });
      }

      setMessage('');
      setShowQuickReplies(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento. Tente novamente.',
        variant: 'destructive',
      });
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
        title: 'Sucesso',
        description: 'Reação enviada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar reação. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  const handleQuickReaction = (emoji: string) => {
    sendQuickReactionMutation.mutate(emoji);
    setIsEmojiOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !activeConversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', activeConversation.id.toString());

    try {
      const response = await apiRequest('POST', '/api/messages/upload', formData);
      
      let messageType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';

      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: response.fileUrl,
          isFromContact: false,
          messageType,
        },
        contact: activeConversation.contact,
      });

      setIsAttachmentOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar arquivo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;

    try {
      await sendAudioMutation.mutateAsync({
        conversationId: activeConversation.id,
        audioBlob,
        duration,
        contact: activeConversation.contact,
      });
      setShowAudioRecorder(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSendLink = async () => {
    if (!linkUrl.trim() || !activeConversation) return;

    const linkMessage = linkText.trim() 
      ? `${linkText}\n${linkUrl}` 
      : linkUrl;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversation.id,
        message: {
          content: linkMessage,
          isFromContact: false,
          messageType: 'text',
        },
        contact: activeConversation.contact,
      });
      setLinkUrl('');
      setLinkText('');
      setIsAttachmentOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar link. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (!activeConversation) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Selecione uma conversa para começar a conversar
        </p>
      </div>
    );
  }

  const filteredQuickReplies = getFilteredQuickReplies();

  return (
    <div className="relative">
      {/* Quick Replies Dropdown */}
      {showQuickReplies && filteredQuickReplies.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mb-2 max-h-64 overflow-y-auto z-50">
          {filteredQuickReplies.map((reply, index) => (
            <div
              key={reply.id || `default-${index}`}
              className={cn(
                "p-3 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                index === selectedQuickReplyIndex 
                  ? "bg-blue-50 dark:bg-blue-900/20" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              onClick={() => selectQuickReply(reply)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{reply.title}</span>
                  {reply.type !== 'text' && (
                    <Badge variant="secondary" className="text-xs">
                      {reply.type === 'audio' ? '🎵' : 
                       reply.type === 'image' ? '🖼️' : 
                       reply.type === 'video' ? '🎥' : '📄'}
                    </Badge>
                  )}
                  {reply.type === 'text' && reply.fileUrl && (
                    <Badge variant="secondary" className="text-xs">📎</Badge>
                  )}
                </div>
                {reply.content && reply.content !== reply.title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {reply.content}
                  </p>
                )}
                {reply.additionalText && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
                    + {reply.additionalText}
                  </p>
                )}
              </div>
              {reply.category && (
                <Badge variant="outline" className="text-xs ml-2">
                  {reply.category}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Toggle entre mensagem normal e nota interna */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-600">
              <Button
                variant={!isInternalNote ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-4 text-xs transition-all rounded-lg font-medium",
                  !isInternalNote 
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm border-0" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
                onClick={() => setIsInternalNote(false)}
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Mensagem
              </Button>
              <Button
                variant={isInternalNote ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-4 text-xs transition-all rounded-lg font-medium",
                  isInternalNote 
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-0" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
                onClick={() => setIsInternalNote(true)}
              >
                <StickyNote className="h-3 w-3 mr-1.5" />
                Nota Interna
              </Button>
            </div>
            {isInternalNote && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Apenas para equipe
                </span>
              </div>
            )}
          </div>
          {isInternalNote && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong>💡 Nota Interna:</strong> Esta mensagem será salva apenas no sistema e não será enviada ao cliente via WhatsApp. Ideal para anotações da equipe, observações e registros internos.
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {QUICK_REPLIES.slice(0, 3).map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => insertQuickReply(reply)}
              >
                <Zap className="w-3 h-3 mr-1" />
                {reply.length > 15 ? `${reply.substring(0, 15)}...` : reply}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <Popover open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 space-y-4">
                <h4 className="font-medium">Anexar arquivo</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full h-16 flex flex-col items-center justify-center gap-1"
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current?.setAttribute('accept', 'image/*');
                      }}
                    >
                      <Image className="h-5 w-5" />
                      <span className="text-xs">Imagem</span>
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => {
                      fileInputRef.current?.click();
                      fileInputRef.current?.setAttribute('accept', 'video/*');
                    }}
                  >
                    <Video className="h-5 w-5" />
                    <span className="text-xs">Vídeo</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => {
                      fileInputRef.current?.click();
                      fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt');
                    }}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Documento</span>
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-16 flex flex-col items-center justify-center gap-1"
                      >
                        <Link className="h-5 w-5" />
                        <span className="text-xs">Link</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="linkText">Texto (opcional)</Label>
                          <Input
                            id="linkText"
                            placeholder="Digite um texto para acompanhar o link"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkUrl">URL</Label>
                          <Input
                            id="linkUrl"
                            placeholder="https://exemplo.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleSendLink} className="w-full">
                          Enviar Link
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Emoji/Reaction Button */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <h4 className="font-medium mb-3">Reações rápidas</h4>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    className="h-10 w-10 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleQuickReaction(emoji)}
                    disabled={sendQuickReactionMutation.isPending}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem... (use / para respostas rápidas)"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              className="min-h-[2.5rem] max-h-32 resize-none pr-12"
              rows={1}
            />
          </div>

          {/* Send/Audio Button */}
          {message.trim() ? (
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              className="h-10 w-10 p-0"
              disabled={sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setShowAudioRecorder(true)}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Audio Recorder Modal */}
        {showAudioRecorder && (
          <AudioRecorder
            onAudioRecorded={handleAudioRecorded}
            onCancel={() => setShowAudioRecorder(false)}
          />
        )}
      </div>
    </div>
  );
}