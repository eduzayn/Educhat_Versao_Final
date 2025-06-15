import { memo, useRef, useEffect, useState, useLayoutEffect } from "react";
import { VariableSizeList as List } from "react-window";
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
    <div style={style} key={message.id}>
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

    // Estimar tamanho dinâmico por mensagem
    const getItemSize = (index: number) => {
      const message = messages[index];
      if (!message) return 100;

      const type = message.messageType;
      if (type === "image" || type === "video") return 300;
      if (type === "audio") return 160;
      if (type === "document") return 140;

      const base = 80;
      const contentLength = message.content?.length || 0;
      return base + Math.min(contentLength * 0.3, 300);
    };

    // Scroll para o final
    const scrollToBottom = () => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, "end");
      }
    };

    // Scroll no início da conversa
    useEffect(() => {
      if (conversationId !== prevConversationId.current) {
        setShouldScrollToBottom(true);
        prevConversationId.current = conversationId;
        prevMessageCount.current = messages.length;
      }
    }, [conversationId]);

    // Scroll quando novas mensagens chegam
    useEffect(() => {
      if (messages.length > prevMessageCount.current && shouldScrollToBottom) {
        scrollToBottom();
      }
      prevMessageCount.current = messages.length;
    }, [messages.length, shouldScrollToBottom]);

    // Scroll quando carregar inicialmente
    useLayoutEffect(() => {
      if (messages.length > 0 && shouldScrollToBottom) {
        requestAnimationFrame(() => scrollToBottom());
      }
    }, [messages.length, shouldScrollToBottom]);

    const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested && messages.length > 0) {
        const totalApproxHeight = messages.reduce(
          (sum, _, i) => sum + getItemSize(i),
          0,
        );
        const isNearBottom = scrollOffset + height >= totalApproxHeight - 200;
        setShouldScrollToBottom(isNearBottom);
      }
    };

    const itemData = useMemo(
      () => ({
        messages,
        contact,
        conversationId,
      }),
      [messages, contact, conversationId],
    );

    return (
      <List
        ref={listRef}
        height={height}
        width="100%"
        itemCount={messages.length}
        itemSize={getItemSize}
        itemData={itemData}
        onScroll={handleScroll}
        style={{ overflowX: "hidden" }}
      >
        {MessageItem}
      </List>
    );
  },
);

VirtualizedMessageList.displayName = "VirtualizedMessageList";

export default VirtualizedMessageList;
