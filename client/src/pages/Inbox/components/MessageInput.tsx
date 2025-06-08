import { useState } from 'react';
import { Button } from '../../button';
import { Textarea } from '../../textarea';
import { Send, Mic } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { MediaAttachmentModal } from '@/modules/Messages/components/MediaAttachmentModal';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: message.trim(),
          messageType: 'text'
        })
      });

      // Limpar o campo de mensagem
      setMessage('');
      
      // Invalidar cache para atualizar as mensagens
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });
      
      // Callback opcional
      onSendMessage?.();
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, caption?: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId.toString());
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      // Invalidar cache para atualizar as mensagens
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });
      
      onSendMessage?.();
      
      toast({
        title: "Arquivo enviado",
        description: "Seu arquivo foi enviado com sucesso.",
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkShare = async (url: string, caption?: string) => {
    setIsLoading(true);
    try {
      const content = caption ? `${caption}\n\n${url}` : url;
      
      await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          messageType: 'text'
        })
      });

      // Invalidar cache para atualizar as mensagens
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });
      
      onSendMessage?.();
      
      toast({
        title: "Link compartilhado",
        description: "Seu link foi compartilhado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao compartilhar link:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o link. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end gap-3">
        {/* Componente de anexo de mídia com interface colorida */}
        <MediaAttachmentModal
          onFileUpload={handleFileUpload}
          onLinkShare={handleLinkShare}
          isUploading={isUploading}
        />

        {/* Campo de texto */}
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isLoading}
            aria-label="Campo de mensagem"
            aria-multiline="true"
          />
        </div>

        {/* Botão de áudio */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          aria-label="Gravar áudio"
        >
          <Mic className="w-4 h-4" />
        </Button>

        {/* Botão de enviar */}
        <Button
          onClick={handleSendMessage}
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