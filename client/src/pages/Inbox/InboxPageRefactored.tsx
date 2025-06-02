import { useState, useEffect } from 'react';
import { ConversationList } from './components/ConversationList';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Phone, Video, Info, MoreVertical, ArrowLeft } from 'lucide-react';
import { CHANNELS } from '@/types/chat';
import type { ConversationWithContact } from '@shared/schema';

export function InboxPageRefactored() {
  const [activeConversation, setActiveConversation] = useState<ConversationWithContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Hooks
  const { data: conversations, isLoading: isLoadingConversations } = useConversations(1000);
  const { data: messages, isLoading: isLoadingMessages } = useMessages(activeConversation?.id || null, 2000);
  const { isConnected } = useWebSocket();

  // Responsividade
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Funções auxiliares
  const getChannelIcon = (channel: string) => {
    const channelConfig = CHANNELS[channel];
    return channelConfig?.icon || '💬';
  };

  const handleSelectConversation = (conversation: ConversationWithContact) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setActiveConversation(null);
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Lista de conversas - Sidebar */}
      <div className={`${isMobile ? (showConversationList ? 'flex' : 'hidden') : 'flex'} w-full md:w-96 bg-white border-r border-gray-200 flex-col`}>
        <ConversationList
          conversations={conversations || []}
          isLoading={isLoadingConversations}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Área principal do chat */}
      <div className={`${isMobile ? (showConversationList ? 'hidden' : 'flex') : 'flex'} flex-1 flex-col`}>
        {activeConversation ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={activeConversation.contact?.profileImageUrl || ''} 
                      alt={activeConversation.contact?.name || 'Contato'} 
                    />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                      {activeConversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Indicador de canal */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-xs">
                    {getChannelIcon(activeConversation.channel)}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {activeConversation.contact?.name || `+${activeConversation.contact?.phone}` || 'Contato sem nome'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {CHANNELS[activeConversation.channel]?.name || activeConversation.channel}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações do header */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isFromContact={message.isFromContact}
                    contactName={activeConversation.contact?.name || 'Contato'}
                    showAvatar={true}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie uma mensagem para começar a conversa</p>
                </div>
              )}
            </div>

            {/* Input de mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <MessageInput
                conversationId={activeConversation.id}
                onMessageSent={() => {
                  // Atualizar lista de mensagens seria feito via WebSocket ou refetch
                }}
                contactPhone={activeConversation.contact?.phone || ''}
              />
            </div>
          </>
        ) : (
          /* Estado sem conversa selecionada */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha uma conversa da lista para começar a responder mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}