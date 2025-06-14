import { useEffect, useState } from "react";
import { useInternalChat } from "@/shared/store/unifiedChatStore";

interface ReactionToast {
  id: string;
  emoji: string;
  userName: string;
  messageId: string;
  timestamp: Date;
}

export function EmojiReactionToast() {
  const [toasts, setToasts] = useState<ReactionToast[]>([]);
  const internalChat = useInternalChat();

  useEffect(() => {
    // Simplified implementation - reactions will be handled by other components
    // This component is temporarily disabled during store migration
  }, [internalChat.messages]);

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