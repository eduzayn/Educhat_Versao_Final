import { useEffect, useState } from 'react';
import { useInternalChatStore } from '@/shared/store/internalChatStore';

interface ReactionToast {
  id: string;
  emoji: string;
  userName: string;
  messageId: string;
  timestamp: Date;
}

export function EmojiReactionToast() {
  const [toasts, setToasts] = useState<ReactionToast[]>([]);

  useEffect(() => {
    const unsubscribe = useInternalChatStore.subscribe(
      (state) => state.messages,
      (messages, previousMessages) => {
        // Detectar novas reações comparando com estado anterior
        Object.entries(messages).forEach(([channelId, channelMessages]) => {
          const previousChannelMessages = previousMessages?.[channelId] || [];
          
          channelMessages.forEach((message, index) => {
            const previousMessage = previousChannelMessages[index];
            
            if (previousMessage) {
              Object.entries(message.reactions).forEach(([emoji, userIds]) => {
                const previousUserIds = previousMessage.reactions[emoji] || [];
                const newUserIds = userIds.filter(id => !previousUserIds.includes(id));
                
                newUserIds.forEach(userId => {
                  // Simular nome do usuário (em um cenário real, buscar do sistema)
                  const userName = `Usuário ${userId}`;
                  
                  const newToast: ReactionToast = {
                    id: `${message.id}-${emoji}-${userId}-${Date.now()}`,
                    emoji,
                    userName,
                    messageId: message.id,
                    timestamp: new Date()
                  };
                  
                  setToasts(prev => [...prev, newToast]);
                  
                  // Auto remover após 3 segundos
                  setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== newToast.id));
                  }, 3000);
                });
              });
            }
          });
        });
      }
    );

    return unsubscribe;
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2 animate-in slide-in-from-right-5 fade-in-0 duration-300"
        >
          <span className="text-2xl">{toast.emoji}</span>
          <div className="text-sm">
            <p className="font-medium">{toast.userName}</p>
            <p className="text-muted-foreground">reagiu à mensagem</p>
          </div>
        </div>
      ))}
    </div>
  );
}