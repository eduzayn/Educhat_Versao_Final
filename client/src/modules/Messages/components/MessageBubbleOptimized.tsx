import { memo } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message, Contact } from "@shared/schema";

interface MessageBubbleOptimizedProps {
  message: Message;
  contact: Contact;
  conversationId?: number;
}

export const MessageBubbleOptimized = memo(function MessageBubbleOptimized({
  message,
  contact,
  conversationId = 0
}: MessageBubbleOptimizedProps) {
  return (
    <MessageBubble
      message={message}
      contact={contact}
      channelIcon="💬"
      channelColor="text-gray-500"
      conversationId={conversationId}
      onReply={(message) => {
        // Extrair messageId dos metadados da mensagem
        const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata : {};
        let messageId = null;
        
        if ("messageId" in metadata && metadata.messageId) {
          messageId = metadata.messageId;
        } else if ("zaapId" in metadata && metadata.zaapId) {
          messageId = metadata.zaapId;
        } else if ("id" in metadata && metadata.id) {
          messageId = metadata.id;
        }
        
        // Enviar evento para InputArea via custom event
        window.dispatchEvent(new CustomEvent('replyToMessage', {
          detail: { messageId, content: message.content }
        }));
      }}
    />
  );
});