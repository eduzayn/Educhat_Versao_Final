import { useState } from 'react';
import { useQuickReplies, QuickReply } from './useQuickReplies';

export function useMessageInput() {
  const [message, setMessageState] = useState('');
  const quickReplies = useQuickReplies();

  const clearMessage = () => setMessageState('');

  const setMessage = (newMessage: string) => {
    setMessageState(newMessage);
    quickReplies.handleQuickReplyDetection(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent, onSubmit: () => void) => {
    // Primeiro, verifica se as respostas rápidas devem lidar com a tecla
    const quickReplyResult = quickReplies.handleKeyNavigation(e);
    
    if (quickReplyResult === true) {
      // Evento foi tratado pelas respostas rápidas
      return;
    } else if (quickReplyResult && typeof quickReplyResult === 'object') {
      // Uma resposta rápida foi selecionada
      const selectedReply = quickReplyResult as QuickReply;
      setMessageState(selectedReply.content);
      return;
    }

    // Comportamento padrão do input
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const selectQuickReply = (quickReply: QuickReply) => {
    const selectedReply = quickReplies.selectQuickReply(quickReply);
    setMessageState(selectedReply.content);
  };

  return {
    message,
    setMessage,
    clearMessage,
    handleKeyDown,
    selectQuickReply,
    quickReplies,
  };
}