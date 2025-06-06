import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

const toastState: ToastState = {
  toasts: []
};

export function useToast() {
  const [, forceUpdate] = useState({});

  const toast = (toast: Toast) => {
    toastState.toasts.push(toast);
    forceUpdate({});
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const index = toastState.toasts.indexOf(toast);
      if (index > -1) {
        toastState.toasts.splice(index, 1);
        forceUpdate({});
      }
    }, 5000);
  };

  return { toast };
}