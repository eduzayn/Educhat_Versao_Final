import { useState } from 'react';

export function useMessageInput() {
  const [message, setMessage] = useState('');

  const clearMessage = () => setMessage('');

  const handleKeyDown = (e: React.KeyboardEvent, onSubmit: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return {
    message,
    setMessage,
    clearMessage,
    handleKeyDown,
  };
}