import { MessagesContainer } from './components/MessagesContainer';
import { EmptyState } from './components/EmptyState';
import { LoadingState } from './components/LoadingState';
import { useMessagesArea } from './hooks/useMessagesArea';

interface MessagesAreaProps {
  activeConversation: any;
  getChannelInfo: (channel: string) => {
    icon: string;
    color: string;
    label: string;
  };
}

export function MessagesArea({
  activeConversation,
  getChannelInfo,
}: MessagesAreaProps) {
  const {
    messages,
    isLoading,
    messagesEndRef,
    handleReply
  } = useMessagesArea(activeConversation);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>Selecione uma conversa para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white min-h-0">
      {isLoading && messages.length === 0 ? (
        <LoadingState />
      ) : messages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessagesContainer
          messages={messages}
          activeConversation={activeConversation}
          getChannelInfo={getChannelInfo}
          onReply={handleReply}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
}