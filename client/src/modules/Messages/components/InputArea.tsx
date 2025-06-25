import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, MicOff, X, Image as ImageIcon, Video, FileText, StickyNote, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AudioRecorder } from "./AudioRecorder";
import { ImageUpload } from "./ImageUpload";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { useSendMessage } from "@/shared/lib/hooks/useMessages";
import { useAudioMessage } from "@/shared/lib/hooks/useAudioMessage";
import { useImageMessage } from "@/shared/lib/hooks/useImageMessage";
import { useFileMessage } from "@/shared/lib/hooks/useFileMessage";
import { useVideoMessage } from "@/shared/lib/hooks/useVideoMessage";
import { useWebSocket } from "@/shared/lib/hooks/useWebSocket";

import { useToast } from "@/shared/lib/hooks/use-toast";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { QuickReply } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { QuickReplyAutocomplete } from "@/components/QuickReplyAutocomplete";

interface InputAreaProps {
  activeConversation: any;
}

export function InputArea({ activeConversation }: InputAreaProps) {
  // Validação crítica no início
  if (!activeConversation) {

    return (
      <div className="border-t bg-white p-4">
        <div className="text-center text-gray-500">
          Selecione uma conversa para enviar mensagens
        </div>
      </div>
    );
  }
  const [message, setMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; content: string } | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplySearchTerm, setQuickReplySearchTerm] = useState("");
  const [quickReplyPosition, setQuickReplyPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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
        isFromContact: false,
        replyToMessageId: replyingTo?.messageId || null,
      },
      contact: activeConversation.contact,
    });

    setMessage("");
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Se autocomplete está aberto, deixar o componente QuickReplyAutocomplete gerenciar
    if (showQuickReplies) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Detectar atalho de respostas rápidas
  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Detectar padrão /* para respostas rápidas
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const quickReplyMatch = textBeforeCursor.match(/\/(\w*)$/);
    
    if (quickReplyMatch) {
      const searchTerm = quickReplyMatch[1];
      setQuickReplySearchTerm(searchTerm);
      
      // Calcular posição do autocomplete
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const position = {
          top: rect.top - 300, // Acima do textarea
          left: rect.left
        };
        setQuickReplyPosition(position);
      }
      
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
      setQuickReplySearchTerm("");
    }
  };

  // Selecionar resposta rápida
  const handleQuickReplySelect = (quickReply: QuickReply) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    // Remover o padrão /termo e inserir o conteúdo da resposta rápida
    const quickReplyMatch = textBeforeCursor.match(/\/(\w*)$/);
    if (quickReplyMatch) {
      const newTextBefore = textBeforeCursor.replace(/\/(\w*)$/, quickReply.content || '');
      const newMessage = newTextBefore + textAfterCursor;
      setMessage(newMessage);
      
      // Focar e posicionar cursor após o conteúdo inserido
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = newTextBefore.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
    
    setShowQuickReplies(false);
    setQuickReplySearchTerm("");
  };

  // Fechar autocomplete
  const handleCloseQuickReplies = () => {
    setShowQuickReplies(false);
    setQuickReplySearchTerm("");
  };

  // Função para enviar nota interna
  const handleSendInternalNote = async () => {
    if (!noteContent.trim() || !activeConversation?.id) return;

    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: noteContent.trim(),
          messageType: 'text',
          direction: 'internal',
          isInternalNote: true,
          isFromContact: false, // Campo obrigatório
          authorId: user?.id,
          authorName: user?.displayName || user?.username || 'Atendente',
          sentAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar nota interna');
      }

      // Atualizar cache React Query imediatamente
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${activeConversation.id}/messages`] 
      });

      toast({
        title: "Nota interna adicionada",
        description: "A nota foi salva com sucesso."
      });

      setNoteContent("");
      setShowNoteDialog(false);

    } catch (error) {
      console.error('Erro ao adicionar nota interna:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota. Tente novamente.",
        variant: "destructive"
      });
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

    // Fechar o gravador após envio
    setIsRecording(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      // Manter foco e posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.emoji-menu') && !target.closest('.emoji-button')) {
        setIsEmojiOpen(false);
      }
      if (!target.closest('.attachment-menu') && !target.closest('.attachment-button')) {
        setIsAttachmentOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Layout WhatsApp-like com componentes dentro do textarea */}
      <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-1">
        <div className="flex items-center gap-1">
          
          {/* Botão de anexo - estilo WhatsApp */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
              className="attachment-button h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            {/* Menu de anexos modernizado */}
            {isAttachmentOpen && (
              <div className="attachment-menu absolute bottom-full left-0 mb-2 bg-white border rounded-xl shadow-xl p-3 z-[9999] min-w-[160px]">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFileUpload('image');
                      setIsAttachmentOpen(false);
                    }}
                    className="justify-start h-9 hover:bg-blue-50 text-gray-700"
                  >
                    <ImageIcon className="w-4 h-4 mr-3 text-blue-500" />
                    Imagem
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFileUpload('video');
                      setIsAttachmentOpen(false);
                    }}
                    className="justify-start h-9 hover:bg-red-50 text-gray-700"
                  >
                    <Video className="w-4 h-4 mr-3 text-red-500" />
                    Vídeo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFileUpload('document');
                      setIsAttachmentOpen(false);
                    }}
                    className="justify-start h-9 hover:bg-gray-50 text-gray-700"
                  >
                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                    Documento
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Campo de texto principal */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (/* para respostas rápidas)"
              className="min-h-[36px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus:border-0 focus-visible:ring-0 p-2 pr-16"
              rows={1}
              id="inbox-message-input"
            />
            
            {/* Botões dentro do textarea */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {/* Botão de emoji */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className="emoji-button h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <Smile className="w-4 h-4" />
              </Button>

              {/* Gravador de áudio */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {

                  setIsRecording(!isRecording);
                }}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                title="Clique para gravar áudio"
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Botão de nota interna - visível para atendentes */}
          <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full"
                title="Adicionar nota interna"
              >
                <StickyNote className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Nota Interna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Digite sua nota interna..."
                  className="min-h-[100px]"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNoteDialog(false);
                      setNoteContent('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSendInternalNote}
                    disabled={!noteContent.trim()}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Salvar Nota
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Botão de enviar - estilo WhatsApp */}
          <Button
            onClick={() => {
              console.log('🖱️ Clique no botão enviar:', { 
                hasMessage: !!message.trim(),
                hasConversation: !!activeConversation?.id,
                isPending: sendMessageMutation.isPending
              });
              handleSendMessage();
            }}
            disabled={!message.trim() || sendMessageMutation.isPending || !activeConversation?.id}
            size="sm"
            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ pointerEvents: 'auto' }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Menu de emoji - reposicionado */}
        {isEmojiOpen && (
          <div className="emoji-menu absolute bottom-full right-16 mb-2 z-[9999] bg-white border rounded-xl shadow-xl p-4 max-w-xs">
            <div className="grid grid-cols-8 gap-2">
              {[
                '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤐', '🥴', '😵', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
                '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
                '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🏃', '💃', '🕺', '🕴️', '👯', '🧖', '🧗', '🏇', '⛷️', '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧘', '🛀', '🛌',
                '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂',
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐷', '🐽', '🐴', '🦄', '🐮', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦓', '🦒', '🐘', '🦏', '🦛', '🐪', '🐫', '🦙', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔',
                '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️',
                '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🐙', '🦪', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥢', '🥡',
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥇', '🥈', '🥉', '🏆', '🏅', '🎖️', '🏵️', '🎗️',
                '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁',
                '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧴', '🧷', '🧸', '🧵', '🧶', '🪡', '🧮', '🎉', '🎊', '🎈', '🎁', '🎀', '🪅', '🪆', '🎯', '🎮', '🕹️', '🎰', '🎲', '🧩', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢',
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
              ].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleEmojiSelect(emoji);
                    setIsEmojiOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Componente AudioRecorder isolado para InputArea */}
        {isRecording && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-[9999]" id="inbox-audio-recorder">
            <AudioRecorder 
              onSendAudio={handleSendAudio}
              onCancel={() => setIsRecording(false)}
              autoStart={true}
              className="bg-white border rounded-lg shadow-lg p-4"
            />
          </div>
        )}

        {/* Autocomplete de Respostas Rápidas */}
        {showQuickReplies && (
          <QuickReplyAutocomplete
            searchTerm={quickReplySearchTerm}
            onSelect={handleQuickReplySelect}
            onClose={handleCloseQuickReplies}
            position={quickReplyPosition}
          />
        )}


      </div>
    </div>
  );
}