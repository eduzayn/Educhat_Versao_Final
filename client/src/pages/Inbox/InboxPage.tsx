import { useState } from 'react';
import { BackButton } from '@/shared/components/BackButton';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useChatStore } from '@/shared/store/store/chatStore';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels } from '@/shared/lib/hooks/useChannels';
import { useQuery } from '@tanstack/react-query';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ChatArea } from './components/ChatArea';
import type { ConversationWithContact } from '@shared/schema';

export function InboxPage() {
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { data: channels = [] } = useChannels();
  
  // Carregar equipes para identificação de canais
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    }
  });
  
  // Integração com Z-API para comunicação em tempo real
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  
  // Inicializar WebSocket para mensagens em tempo real
  useWebSocket();
  
  const { 
    data: conversations, 
    isLoading, 
    refetch 
  } = useConversations(1000, { 
    refetchInterval: false, // Desabilitar polling - usar WebSocket para tempo real
    staleTime: 30000 // Cache por 30 segundos para melhor performance
  });
  
  const { activeConversation, setActiveConversation, markConversationAsRead } = useChatStore();
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: ConversationWithContact) => {
    setActiveConversation(conversation);
    // Marcar como lida tanto no store local quanto na API
    markConversationAsRead(conversation.id);
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
        <div className="ml-auto text-sm text-gray-500">
          {conversations?.length || 0} conversas
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Conversas */}
        <ConversationSidebar
          conversations={conversations || []}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoading}
          channels={channels}
          showMobileChat={showMobileChat}
        />

        {/* Área de Chat */}
        <div className={`flex-1 ${showMobileChat ? 'mobile-show' : 'mobile-hide'}`}>
          <ChatArea
            conversation={activeConversation}
            onBack={handleBackToList}
            showBackButton={true}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-hide {
            display: none;
          }
          .mobile-show {
            display: flex;
          }
          .mobile-full-width {
            width: 100%;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-hide,
          .mobile-show {
            display: flex;
          }
          .mobile-full-width {
            width: 320px;
          }
        }
      `}</style>
    </div>
  );
}