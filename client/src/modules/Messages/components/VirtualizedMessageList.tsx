import { memo, useRef, useEffect, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { MessageBubble } from "./MessageBubble";
import type { Message, Contact } from "@shared/schema";

interface VirtualizedMessageListProps {
  messages: Message[];
  contact: Contact;
  conversationId?: number;
  height: number;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    contact: Contact;
    conversationId?: number;
  };
}

const MessageItem = memo(({ index, style, data }: MessageItemProps) => {
  const { messages, contact, conversationId } = data;
  const message = messages[index];

  if (!message) return null;

  return (
    <div style={style}>
      <MessageBubble
        message={message}
        contact={contact}
        conversationId={conversationId}
      />
    </div>
  );
});

MessageItem.displayName = "MessageItem";

export const VirtualizedMessageList = memo(
  ({
    messages,
    contact,
    conversationId,
    height,
  }: VirtualizedMessageListProps) => {
    const listRef = useRef<List>(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const prevConversationId = useRef<number | undefined>(conversationId);
    const prevMessageCount = useRef<number>(0);

    // Função para rolar para o final
    const scrollToBottom = () => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, "end");
      }
    };

    // Rolar para o final quando a conversa mudar
    useEffect(() => {
      if (conversationId !== prevConversationId.current) {
        setShouldScrollToBottom(true);
        prevConversationId.current = conversationId;
        prevMessageCount.current = messages.length;
        
        // Aguardar um pouco para garantir que as mensagens foram carregadas
        setTimeout(() => {
          scrollToBottom();
        }, 150);
      }
    }, [conversationId, messages.length]);

    // Rolar para o final quando novas mensagens chegarem (se o usuário estava no final)
    useEffect(() => {
      if (messages.length > prevMessageCount.current && shouldScrollToBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      }
      prevMessageCount.current = messages.length;
    }, [messages.length, shouldScrollToBottom]);

    // Rolar para o final no carregamento inicial
    useEffect(() => {
      if (messages.length > 0 && listRef.current) {
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    }, [messages.length > 0]);

    const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested && messages.length > 0) {
        // Verificar se o usuário está próximo ao final da lista
        const totalHeight = messages.length * 120;
        const isNearBottom = scrollOffset + height >= totalHeight - 200; // 200px de tolerância
        setShouldScrollToBottom(isNearBottom);
      }
    };

    const itemData = {
      messages,
      contact,
      conversationId,
    };

    return (
      <List
        ref={listRef}
        height={height}
        width={`100%`}
        itemCount={messages.length}
        itemSize={120} // Altura aproximada de cada mensagem
        itemData={itemData}
        onScroll={handleScroll}
        style={{
          overflowX: "hidden",
        }}
      >
        {MessageItem}
      </List>
    );
  },
);

VirtualizedMessageList.displayName = "VirtualizedMessageList";
