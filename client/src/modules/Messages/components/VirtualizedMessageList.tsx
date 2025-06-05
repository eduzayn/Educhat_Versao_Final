import { memo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';
import type { Message, Contact } from '@shared/schema';

interface VirtualizedMessageListProps {
  messages: Message[];
  contact: Contact;
  conversationId?: number;
  height: number;
  onReply?: (messageId: string, content: string) => void;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    contact: Contact;
    conversationId?: number;
    onReply?: (messageId: string, content: string) => void;
    allMessages: Message[];
  };
}

const MessageItem = memo(({ index, style, data }: MessageItemProps) => {
  const { messages, contact, conversationId, onReply, allMessages } = data;
  const message = messages[index];

  if (!message) return null;

  return (
    <div style={style}>
      <MessageBubble
        message={message}
        contact={contact}
        conversationId={conversationId}
        onReply={onReply}
        allMessages={allMessages}
      />
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const VirtualizedMessageList = memo(({
  messages,
  contact,
  conversationId,
  height,
  onReply
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
    conversationId,
    onReply,
    allMessages: messages
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