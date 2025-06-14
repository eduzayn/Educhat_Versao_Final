import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useUserActivity() {
  const { user } = useAuth();

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await fetch('/api/internal-chat/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Marcar como online ao carregar
    updateOnlineStatus(true);

    // Marcar como offline ao sair
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/internal-chat/user/status', 
        JSON.stringify({ isOnline: false }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [user]);

  return { updateOnlineStatus };
}