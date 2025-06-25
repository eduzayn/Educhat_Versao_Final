import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface NotificationData {
  conversationId: number;
  message: {
    content: string;
    isFromContact: boolean;
    messageType: string;
    sentAt: string;
  };
  contact: {
    name: string;
    phone: string;
  };
}

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Inicializar áudio de notificação
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.warn);
    }
  };

  const showNotification = (data: NotificationData) => {
    // Sempre mostrar notificação - será filtrada no componente se necessário

    // Mostrar toast notification
    toast({
      title: `Nova mensagem de ${data.contact.name}`,
      description: data.message.content.length > 50 
        ? `${data.message.content.substring(0, 50)}...`
        : data.message.content,
      duration: 5000,
    });

    // Tocar som de notificação
    playNotificationSound();

    // Atualizar badge de não lidas
    queryClient.invalidateQueries({ queryKey: ['/api/conversations/unread-count'] });
  };

  const handleNewMessage = (data: NotificationData) => {
    // Apenas notificar mensagens de contatos (não próprias)
    if (data.message.isFromContact) {
      showNotification(data);
    }
  };

  return {
    handleNewMessage,
    playNotificationSound,
  };
}