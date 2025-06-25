import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

// Estado global simples para toasts
let globalToastState: ToastState = { toasts: [] };
const listeners: Set<(state: ToastState) => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener(globalToastState));
}

export function useToast() {
  const [state, setState] = useState(globalToastState);

  // Registrar listener para atualizações
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = (++toastCount).toString();
    const newToast: Toast = { id, title, description, variant };
    
    globalToastState = {
      ...globalToastState,
      toasts: [...globalToastState.toasts, newToast]
    };
    
    notifyListeners();

    // Auto remove after 5 seconds
    setTimeout(() => {
      globalToastState = {
        ...globalToastState,
        toasts: globalToastState.toasts.filter(t => t.id !== id)
      };
      notifyListeners();
    }, 5000);

    return { id };
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    globalToastState = {
      ...globalToastState,
      toasts: toastId 
        ? globalToastState.toasts.filter(t => t.id !== toastId)
        : []
    };
    notifyListeners();
  }, []);

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}