import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { useUnifiedChatStore } from "@/shared/store/unifiedChatStore";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useToast } from "@/shared/lib/hooks/use-toast";

interface ChatUser {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
}

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const store = useUnifiedChatStore();
  const activeChannel = store.internal.activeChannel;
  const { user } = useAuth();
  const { toast } = useToast();

  const currentUser = user as ChatUser | undefined;

  const handleSubmit = async () => {
    if (!message.trim() || !activeChannel || !currentUser) return;

    try {
      // Create internal message with required structure
      const messageId = Math.floor(Date.now() + Math.random() * 1000);
      const now = new Date();
      
      const newMessage = {
        id: messageId,
        conversationId: 0,
        content: message.trim(),
        messageType: 'text' as const,
        isFromContact: false,
        metadata: {},
        isDeleted: false,
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: null,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: currentUser.id,
        authorName: currentUser.displayName || currentUser.username,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null,
        chatType: 'internal' as const,
        channelId: activeChannel,
      };

      store.addInternalMessage(newMessage);
      setMessage("");
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!activeChannel) {
    return (
      <div className="p-4 border-t bg-muted/10">
        <p className="text-sm text-muted-foreground text-center">
          Selecione um canal para começar a conversar
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <div className="flex-1 space-y-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="min-h-[60px] max-h-32 resize-none"
          disabled={!currentUser}
        />
      </div>

      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
          <Smile className="w-4 h-4" />
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!message.trim() || !currentUser}
          className="h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}