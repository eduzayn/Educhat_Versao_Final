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
  // Garantir que o hook sempre seja chamado com um valor válido
  const conversationToUse = activeConversation || { id: null };
  
  const {
    messages,
    isLoading,
    messagesEndRef,
    handleReply,
    hasNextPage,
    loadPreviousMessages
  } = useMessagesArea(conversationToUse);

  // Renderização condicional APÓS todos os hooks
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
          hasNextPage={hasNextPage}
          loadPreviousMessages={loadPreviousMessages}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}