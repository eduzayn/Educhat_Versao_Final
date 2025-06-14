import { useState, useEffect } from 'react';
import { Badge } from '@/shared/ui/badge';
import { ContactDialog } from '@/shared/components/ContactDialog';
import { MessageSquare } from 'lucide-react';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { useInfiniteConversations } from '@/shared/lib/hooks/useInfiniteConversations';
import { useQuery } from '@tanstack/react-query';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/chatStore';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels } from '@/shared/lib/hooks/useChannels';
import { useContactData } from '@/shared/lib/hooks/useContactData';
import { STATUS_CONFIG } from '@/types/chat';

import { ConversationActionsDropdown } from './components/ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './components/ConversationAssignmentDropdown';
import { ContactSidebar } from './components/ContactSidebar';
import { ConversationListVirtualized } from './components/ConversationListVirtualized';
import { ChatHeader } from './components/ChatHeader';
import { MessagesArea } from './components/MessagesArea';


export function InboxPage() {

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [canalOrigemFilter, setCanalOrigemFilter] = useState('all');
  const [nomeCanalFilter, setNomeCanalFilter] = useState('all');
  const { data: channels = [] } = useChannels();
  const [showMobileChat, setShowMobileChat] = useState(false);
  
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
  
  // Estado para debounce da busca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce do termo de busca - aguarda 500ms após parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hook unificado para conversas com busca integrada
  const conversationsQuery = useInfiniteConversations(100, {
    searchTerm: debouncedSearchTerm,
    refetchInterval: debouncedSearchTerm ? false : 10000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Dados consolidados
  const conversations = conversationsQuery.data?.pages.flatMap(page => page.conversations) || [];
  const isLoadingConversations = conversationsQuery.isLoading;
  const hasNextPage = conversationsQuery.hasNextPage;
  const fetchNextPage = conversationsQuery.fetchNextPage;
  const { activeConversation, setActiveConversation, messages: storeMessages } = useChatStore();
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    // Marcar como lida na API (store local não precisa mais gerenciar isso)
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };
  
  const { 
    data: messages, 
    isLoading: isLoadingMessages
  } = useMessages(activeConversation?.id || null, 100); // Carregar apenas 100 mensagens mais recentes
  

  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Usar hook consolidado para dados do contato
  const {
    notes: contactNotes,
    deals: contactDeals,
    interests: contactInterests,
    refetch: refetchContactData
  } = useContactData(activeConversation?.contactId || null);

  // Verificar se WhatsApp está disponível para comunicação
  const isWhatsAppAvailable = Boolean(zapiStatus?.connected && zapiStatus?.smartphoneConnected);

  // Dados do contato agora gerenciados pelo hook consolidado useContactData



  const handleAddNote = async () => {
    if (!newNote.trim() || !activeConversation) return;

    try {
      const response = await fetch(`/api/contacts/${activeConversation.contactId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newNote.trim(),
          authorName: 'Atendente Atual' // Em produção, pegar do usuário logado
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar nota');
      }

      toast({
        title: "Nota adicionada",
        description: "A nota interna foi salva com sucesso."
      });

      setNewNote('');
      setShowNoteDialog(false);
      
      // Recarregar os dados do contato
      refetchContactData();

    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Dados do contato carregados automaticamente pelo hook useContactData





  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    
    return (
      <Badge 
        variant="secondary" 
        className={`${config.bgColor} ${config.color} text-xs`}
      >
        {config.label}
      </Badge>
    );
  };

  const getChannelInfo = (channel: string) => {
    // Channel info now handled by backend data
    return { icon: '💬', color: 'text-gray-500', label: 'Canal' };
  };

  // Função removida - agora usamos apenas ícones de canal

  // Função removida - agora usamos apenas ícones de canal

  const formatTime = (date: string | Date) => {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(dateObj);
  };

  // Função para alterar status da conversa
  const handleStatusChange = async (conversationId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      // Atualizar o estado local imediatamente para melhor UX
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation({
          ...activeConversation,
          status: newStatus
        });
      }

      // Invalidar cache para recarregar conversas
      conversationsQuery.refetch();
      
      toast({
        title: "Status atualizado",
        description: `Status da conversa alterado para: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`,
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa",
        variant: "destructive"
      });
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 mobile-full-height">
      {/* Lista de Conversas */}
      <div className={`w-80 md:w-80 ${showMobileChat ? 'mobile-hide' : 'mobile-full-width'} bg-white border-r border-gray-200 flex flex-col`}>
        {/* Lista de Conversas com Scroll Infinito */}
        <ConversationListVirtualized
          conversations={conversations}
          isLoading={isLoadingConversations}
          hasNextPage={hasNextPage || false}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onLoadMore={() => fetchNextPage()}
          channels={channels}
        />
      </div>

      {/* Área de Mensagens */}
      <div className={`flex-1 flex flex-col ${showMobileChat ? 'mobile-full-width' : 'mobile-hide'} md:flex`}>
        {activeConversation ? (
          <>
            {/* Header da Conversa */}
            <ChatHeader
              activeConversation={activeConversation}
              showMobileChat={showMobileChat}
              onMobileBackClick={() => setShowMobileChat(false)}
              onStatusChange={handleStatusChange}
              getChannelInfo={getChannelInfo}
            />

            {/* Mensagens */}
            <MessagesArea
              activeConversation={activeConversation}
              getChannelInfo={getChannelInfo}
            />

            {/* Área de Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <InputArea />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para começar a responder</p>
            </div>
          </div>
        )}
      </div>

      <ContactSidebar 
        activeConversation={activeConversation}
        contactNotes={contactNotes}
        contactDeals={contactDeals}
        contactInterests={contactInterests}
        onAddNote={handleAddNote}
      />
      
      <ContactDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          conversationsQuery.refetch();
        }}
      />
    </div>
  );
}
