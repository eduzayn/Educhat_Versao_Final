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
  const { activeChannel, loadChannels, loadChannelMessages, channels } = useInternalChatStore();

  // Carregar canais baseados nas equipes do usuário na inicialização
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Carregar mensagens de todos os canais disponíveis
  useEffect(() => {
    if (channels.length > 0) {
      channels.forEach(channel => {
        loadChannelMessages(channel.id);
      });
    }
  }, [channels, loadChannelMessages]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <div className="flex-1 flex overflow-hidden mx-2 md:mx-4 rounded-lg shadow-sm border bg-card">
        {/* Sidebar de Canais/Equipes */}
        <div className="w-[280px] md:w-[320px] border-r bg-card flex flex-col shrink-0">
          <ChannelSidebar />
        </div>

        {/* Área Principal de Chat */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-card">
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
          <div className="w-[320px] sm:w-[360px] lg:w-[400px] border-l bg-card flex shrink-0">
            <InfoPanel />
          </div>
        )}
      </div>
    </div>
  );
}