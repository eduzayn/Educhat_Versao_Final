import { useEffect, useRef } from "react";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";

export function SoundNotification() {
  const store = useUnifiedChatStore();
  const soundEnabled = store.soundEnabled;
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastMessageCountRef = useRef(0);

  // Criar áudio de notificação usando Web Audio API
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      // Som de notificação simples usando data URI
      audio.src =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBziNze3HnTELJHfJ8N2QPAkTXrPo66hWEwlEneDyvWMcBzmDwvW+nTELJXLH7N2QQAoUXrPo66hWEwlEneDyvWMcBzeGwfS+nTELJXPH7d2SPAoTYfPo66hWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTAL";
      audioRef.current = audio;
    }
  }, []);

  // Monitorar novas mensagens e tocar som
  useEffect(() => {
    const unsubscribe = useUnifiedChatStore.subscribe(
      (state) => state.internal.messages,
      (messages) => {
        const totalMessages = Object.values(messages).reduce(
          (total: number, channelMessages: any[]) => total + channelMessages.length,
          0,
        );

        if (
          totalMessages > lastMessageCountRef.current &&
          soundEnabled &&
          audioRef.current
        ) {
          try {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
              // Ignorar erro se o usuário não interagiu ainda com a página
            });
          } catch (error) {
            // Ignorar erros de áudio
          }
        }

        lastMessageCountRef.current = totalMessages;
      },
    );

    return unsubscribe;
  }, [soundEnabled]);

  return null;
}
