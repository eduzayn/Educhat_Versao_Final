import { useState, useCallback } from 'react';

export function useModalState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setIsOpen(newOpen);
  }, []);

  return {
    isOpen,
    open,
    close,
    handleOpenChange
  };
}