import { memo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageBubbleOptimized } from './MessageBubbleOptimized';
import type { Message, Contact } from '@shared/schema';

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
      <MessageBubbleOptimized
        message={message}
        contact={contact}
        conversationId={conversationId}
      />
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const VirtualizedMessageList = memo(({
  messages,
  contact,
  conversationId,
  height
}: VirtualizedMessageListProps) => {
  const listRef = useRef<List>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length, shouldScrollToBottom]);

  const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) {
      // User scrolled manually
      const isAtBottom = scrollOffset + height >= (messages.length * 120) - 50;
      setShouldScrollToBottom(isAtBottom);
    }
  };

  const itemData = {
    messages,
    contact,
    conversationId
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
        overflowX: 'hidden'
      }}
    >
      {MessageItem}
    </List>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';