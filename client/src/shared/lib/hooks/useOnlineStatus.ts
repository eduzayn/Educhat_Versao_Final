import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useOnlineStatus() {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);

  const updateUserStatus = async (isOnline: boolean) => {
    if (!user || isOnlineRef.current === isOnline) return;

    try {
      await fetch('/api/internal-chat/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
        credentials: 'include'
      });
      isOnlineRef.current = isOnline;
    } catch (error) {
      console.error('Erro ao atualizar status online:', error);
    }
  };

  const sendHeartbeat = async () => {
    if (!user) return;

    try {
      await fetch('/api/internal-chat/user/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro no heartbeat:', error);
    }
  };

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) return;

    // Enviar heartbeat a cada 30 segundos
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!user) return;

    // Marcar como online quando o componente monta
    updateUserStatus(true);
    startHeartbeat();

    // Detectar quando a aba/janela perde foco
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
        updateUserStatus(false);
      } else {
        updateUserStatus(true);
        startHeartbeat();
      }
    };

    // Detectar quando o usuário sai da página
    const handleBeforeUnload = () => {
      updateUserStatus(false);
    };

    // Detectar mudanças de foco da janela
    const handleFocus = () => {
      updateUserStatus(true);
      startHeartbeat();
    };

    const handleBlur = () => {
      stopHeartbeat();
      updateUserStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      stopHeartbeat();
      updateUserStatus(false);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user]);

  return {
    updateUserStatus,
    sendHeartbeat
  };
}