// Este componente foi substituído pelo InputArea completo
// Redirecionando para o componente principal de entrada de mensagens
import { InputArea } from '@/modules/Messages/components/InputArea';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  // Usar o componente completo InputArea que tem todas as funcionalidades
  return <InputArea />;
}