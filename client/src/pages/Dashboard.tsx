import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { InboxPanel } from '@/modules/Inbox/components/InboxPanel';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ContactPanel } from '@/modules/Contacts/components/ContactPanel';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useChatStore } from '@/shared/store/store/chatStore';

export function Dashboard() {
  const { data: conversations = [] } = useConversations();
  const { setConversations, isConnected, activeConversation, messages } = useChatStore();
  
  useWebSocket();

  useEffect(() => {
    if (conversations.length > 0) {
      setConversations(conversations);
    }
  }, [conversations, setConversations]);

  const currentMessages = activeConversation ? messages[activeConversation.id] || [] : [];

  return (
    <div className="h-screen flex flex-col bg-educhat-light">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <InboxPanel />
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    contact={activeConversation.contact}
                  />
                ))}
              </div>
              
              {/* Input Area */}
              <InputArea />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comment text-gray-400 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-educhat-dark mb-2">Welcome to EduChat</h3>
                <p className="text-educhat-medium">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
        
        <ContactPanel />
      </div>
      
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm">
          Disconnected - Reconnecting...
        </div>
      )}
    </div>
  );
}
