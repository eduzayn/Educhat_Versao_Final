import { Button } from '@/shared/ui/button';
import { Send, Mic } from 'lucide-react';

interface ActionButtonsProps {
  onSendMessage: () => void;
  canSend: boolean;
  isLoading: boolean;
}

export function ActionButtons({ onSendMessage, canSend, isLoading }: ActionButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        aria-label="Gravar áudio"
      >
        <Mic className="w-4 h-4" />
      </Button>

      <Button
        onClick={onSendMessage}
        disabled={!canSend || isLoading}
        size="sm"
        className="mb-2"
        aria-label="Enviar mensagem"
      >
        <Send className="w-4 h-4" />
      </Button>
    </>
  );
}