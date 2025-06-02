import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Send, Paperclip, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/shared/lib/queryClient';
import { queryClient } from '@/shared/lib/queryClient';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end gap-3">
        {/* Botão de anexo */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => {
            // Integrar com sistema de anexos existente
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                // Aqui integraria com o sistema de upload existente
                console.log('Arquivo selecionado:', file.name);
              }
            };
            input.click();
          }}
          aria-label="Anexar arquivo"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

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