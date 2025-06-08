import { useState, useEffect } from 'react';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { InfoPanel } from './components/InfoPanel';

import { ConnectionStatus } from './components/ConnectionStatus';
import { TypingIndicatorGlobal } from './components/TypingIndicatorGlobal';
import { SoundNotification } from './components/SoundNotification';
import { EmojiReactionToast } from './components/EmojiReactionToast';
import { useInternalChatStore } from './store/internalChatStore';

export default function InternalChatPage() {
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const { activeChannel, loadChannels } = useInternalChatStore();

  // Carregar canais baseados nas equipes do usuário na inicialização
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar de Canais/Equipes */}
      <div className="w-[320px] border-r bg-card flex flex-col">
        <ChannelSidebar />
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col relative">
        <ConnectionStatus />
        <ChatHeader 
          onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
          showInfoPanel={showInfoPanel}
        />
        <ChatMessages />
        <TypingIndicatorGlobal />
        <ChatInput />
        <SoundNotification />
        <EmojiReactionToast />
      </div>

      {/* Panel Lateral de Informações */}
      {showInfoPanel && (
        <div className="w-[300px] border-l bg-card flex">
          <InfoPanel />
        </div>
      )}
    </div>
  );
}