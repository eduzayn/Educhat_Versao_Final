import { useState, useCallback, useRef } from 'react';

export function useModalState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const preventCloseRef = useRef(false);

  const open = useCallback(() => {
    preventCloseRef.current = true;
    setIsOpen(true);
    // Reset flag after a short delay
    setTimeout(() => {
      preventCloseRef.current = false;
    }, 100);
  }, []);

  const close = useCallback(() => {
    if (!preventCloseRef.current) {
      setIsOpen(false);
    }
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      open();
    } else if (!preventCloseRef.current) {
      setIsOpen(false);
    }
  }, [open]);

  return {
    isOpen,
    open,
    close,
    handleOpenChange
  };
}