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

    // Scroll to bottom when conversation changes or new messages arrive
    useEffect(() => {
      if (listRef.current && messages.length > 0) {
        // Always scroll to bottom when conversation changes
        if (conversationId !== prevConversationId.current) {
          listRef.current.scrollToItem(messages.length - 1, "end");
          setShouldScrollToBottom(true);
          prevConversationId.current = conversationId;
        } 
        // Scroll to bottom for new messages if user was at bottom
        else if (shouldScrollToBottom) {
          listRef.current.scrollToItem(messages.length - 1, "end");
        }
      }
    }, [messages.length, shouldScrollToBottom, conversationId]);

    // Initial scroll to bottom when messages first load
    useEffect(() => {
      if (listRef.current && messages.length > 0) {
        setTimeout(() => {
          listRef.current?.scrollToItem(messages.length - 1, "end");
        }, 100);
      }
    }, [messages.length > 0]);

    const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested) {
        // User scrolled manually
        const isAtBottom = scrollOffset + height >= messages.length * 120 - 50;
        setShouldScrollToBottom(isAtBottom);
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
