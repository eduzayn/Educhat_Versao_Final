import { MessageBubble } from '@/modules/Messages/components/MessageBubble';

interface MessagesContainerProps {
  messages: any[];
  activeConversation: any;
  getChannelInfo: (channel: string) => {
    icon: string;
    color: string;
    label: string;
  };
  onReply: (message: any) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessagesContainer({
  messages,
  activeConversation,
  getChannelInfo,
  onReply,
  messagesEndRef,
}: MessagesContainerProps) {
  return (
    <>
      {messages.map((message: any) => (
        <MessageBubble
          key={message.id}
          message={message}
          contact={activeConversation?.contact}
          channelIcon={
            getChannelInfo(activeConversation?.channel || '').icon
          }
          channelColor={
            getChannelInfo(activeConversation?.channel || '').color
          }
          conversationId={activeConversation?.id || 0}
          onReply={onReply}
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
}