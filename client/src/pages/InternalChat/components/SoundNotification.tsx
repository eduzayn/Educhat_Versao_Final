import { useEffect, useState } from "react";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";

export function SoundNotification() {
  const store = useUnifiedChatStore();
  const soundEnabled = store.soundEnabled;
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Criar áudio de notificação
  useEffect(() => {
    const newAudio = new Audio();
    newAudio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBziNze3HnTELJHfJ8N2QPAkTXrPo66hWEwlEneDyvWMcBzmDwvW+nTELJXLH7N2QQAoUXrPo66hWEwlEneDyvWMcBzeGwfS+nTELJXPH7d2SPAoTYfPo66hWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTALJXPH7d2SPAoUX7Pm66dWEwlEm+DyvWMcBzeGwfS+nTAL";
    setAudio(newAudio);
  }, []);

  // Monitorar novas mensagens e tocar som
  useEffect(() => {
    if (!soundEnabled || !audio) return;

    const unsubscribe = useUnifiedChatStore.subscribe(
      (state) => state.internal.messages,
      (messages) => {
        const totalMessages = Object.values(messages).reduce(
          (total: number, channelMessages: any[]) => total + channelMessages.length,
          0,
        );

        if (totalMessages > lastMessageCount && lastMessageCount > 0) {
          try {
            audio.currentTime = 0;
            audio.play().catch(() => {
              // Ignorar erro se o usuário não interagiu ainda com a página
            });
          } catch (error) {
            // Ignorar erros de áudio
          }
        }

        setLastMessageCount(totalMessages);
      },
    );

    return unsubscribe;
  }, [soundEnabled, audio, lastMessageCount]);

  return null;
}