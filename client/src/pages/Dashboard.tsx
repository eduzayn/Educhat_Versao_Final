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
  const { setConversations, isConnected } = useChatStore();
  
  // Initialize WebSocket connection
  useWebSocket();

  // Update conversations in store when data changes
  useEffect(() => {
    if (conversations.length > 0) {
      setConversations(conversations);
    }
  }, [conversations]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ConversationSidebar />
        <ChatArea />
        <ContactPanel />
      </div>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-xs text-educhat-medium">
            {isConnected ? 'Connected to EduChat' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}
