import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Separator } from '@/shared/ui/separator';
import { BackButton } from '@/shared/components/BackButton';
import { ContactDialog } from '@/shared/components/ContactDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Link } from 'wouter';
import { 
  Search, 
  Filter,
  X, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Plus
} from 'lucide-react';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/chatStore';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels, Channel } from '@/shared/lib/hooks/useChannels';
import { Textarea } from '@/shared/ui/textarea';
import { STATUS_CONFIG } from '@/types/chat';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { ConversationActionsDropdown } from './components/ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './components/ConversationAssignmentDropdown';
import { ContactSidebar } from './components/ContactSidebar';
import { ConversationFilters } from './components/ConversationFilters';
import { ConversationListHeader } from './components/ConversationListHeader';
import { ConversationList } from './components/ConversationList';
import { ChatHeader } from './components/ChatHeader';
import { MessagesArea } from './components/MessagesArea';


export function InboxPage() {
  const [activeTab, setActiveTab] = useState('inbox');
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
  
  const { 
    data: conversations, 
    isLoading, 
    refetch 
  } = useConversations(50, { 
    refetchInterval: 5000, // Polling a cada 5 segundos como backup do WebSocket
    staleTime: 30000 // Cache por 30 segundos para melhor performance
  }); // Carregar apenas 50 conversas iniciais para carregamento rápido
  const { activeConversation, setActiveConversation, markConversationAsRead, messages: storeMessages } = useChatStore();
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    // Marcar como lida tanto no store local quanto na API
    markConversationAsRead(conversation.id);
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };
  
  const { 
    data: messages, 
    isLoading: isLoadingMessages
  } = useMessages(activeConversation?.id || null, 100); // Carregar apenas 100 mensagens mais recentes
  

  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [contactDeals, setContactDeals] = useState<any[]>([]);
  const [contactInterests, setContactInterests] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Verificar se WhatsApp está disponível para comunicação
  const isWhatsAppAvailable = Boolean(zapiStatus?.connected && zapiStatus?.smartphoneConnected);

  // Buscar negócios, tags e interesses do contato quando a conversa mudar
  useEffect(() => {
    if (activeConversation?.contactId) {
      fetchContactDeals(activeConversation.contactId);
      fetchContactNotes(activeConversation.contactId);
      fetchContactInterests(activeConversation.contactId);
    }
  }, [activeConversation?.contactId]);

  const fetchContactDeals = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/deals`);
      if (response.ok) {
        const data = await response.json();
        setContactDeals(Array.isArray(data.deals) ? data.deals : []);
      }
    } catch (error) {
      console.error('Erro ao buscar negócios do contato:', error);
      setContactDeals([]);
    }
  };

  const fetchContactNotes = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        setContactNotes(Array.isArray(notes) ? notes : []);
      }
    } catch (error) {
      console.error('Erro ao buscar notas do contato:', error);
      setContactNotes([]);
    }
  };

  const fetchContactInterests = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/interests`);
      if (response.ok) {
        const interests = await response.json();
        setContactInterests(Array.isArray(interests) ? interests : []);
      }
    } catch (error) {
      console.error('Erro ao buscar interesses do contato:', error);
      setContactInterests([]);
    }
  };



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
      
      // Recarregar as notas do contato
      loadContactNotes();

    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para carregar notas do contato
  const loadContactNotes = async () => {
    if (!activeConversation?.contactId) return;

    try {
      const response = await fetch(`/api/contacts/${activeConversation.contactId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        setContactNotes(notes);
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  // Carregar notas quando a conversa ativa mudar
  useEffect(() => {
    loadContactNotes();
  }, [activeConversation?.contactId]);



  // Filtrar conversas baseado na aba ativa e filtros
  const filteredConversations = (conversations || []).filter(conversation => {
    // Filtro por aba - CORRIGIDO: conversas reabertas devem aparecer na inbox
    if (activeTab === 'inbox') {
      // Mostrar apenas conversas abertas, pendentes ou não lidas (não mostrar resolvidas/fechadas)
      const activeStatuses = ['open', 'pending', 'unread'];
      if (!activeStatuses.includes(conversation.status || 'open')) return false;
    }
    if (activeTab === 'resolved') {
      // Mostrar apenas conversas resolvidas/fechadas
      const resolvedStatuses = ['resolved', 'closed'];
      if (!resolvedStatuses.includes(conversation.status || 'open')) return false;
    }
    
    // Filtro por busca - pesquisar em nome e telefone do contato
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = conversation.contact.name?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = conversation.contact.phone?.toLowerCase()?.includes(searchLower) || false;
      const emailMatch = conversation.contact.email?.toLowerCase()?.includes(searchLower) || false;
      
      if (!nameMatch && !phoneMatch && !emailMatch) {
        return false;
      }
    }
    
    // Filtro por status
    if (statusFilter !== 'all' && conversation.status !== statusFilter) return false;
    
    // Filtro por canal - implementação escalável para canais específicos
    if (channelFilter !== 'all') {
      // Filtro geral por tipo de canal (ex: "whatsapp", "instagram")
      if (channelFilter === conversation.channel) {
        return true;
      }
      
      // Filtro específico por canal WhatsApp (ex: "whatsapp-1", "whatsapp-2")
      if (channelFilter.startsWith('whatsapp-')) {
        const specificChannelId = parseInt(channelFilter.replace('whatsapp-', ''));
        return conversation.channel === 'whatsapp' && conversation.channelId === specificChannelId;
      }
      
      // Se não corresponde a nenhum filtro específico, excluir
      return false;
    }
    
    return true;
  });

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

      // Recarregar conversas para manter sincronização
      refetch();
      
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

  if (isLoading) {
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
        {/* Header */}
        <ConversationListHeader
          activeTab={activeTab}
          searchTerm={searchTerm}
          isWhatsAppAvailable={isWhatsAppAvailable}
          onTabChange={setActiveTab}
          onSearchChange={setSearchTerm}
          onNewContactClick={() => setIsModalOpen(true)}
          onRefresh={() => refetch()}
        />

        {/* Filtros compactos */}
        <ConversationFilters
          statusFilter={statusFilter}
          channelFilter={channelFilter}
          onStatusFilterChange={setStatusFilter}
          onChannelFilterChange={setChannelFilter}
          channels={channels}
        />

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation, index) => (
            <div
              key={`conversation-${conversation.id}-${index}`}
              onClick={() => handleSelectConversation(conversation)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                activeConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar do contato */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={conversation.contact?.profileImageUrl || ''} 
                      alt={conversation.contact?.name || 'Contato'} 
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                      {conversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Ícone de canal pequeno */}
                  <div className="absolute -bottom-1 -right-1">
                    <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                      conversation.channel === 'whatsapp' ? 'text-green-600 bg-green-50' :
                      conversation.channel === 'instagram' ? 'text-pink-600 bg-pink-50' :
                      conversation.channel === 'facebook' ? 'text-blue-600 bg-blue-50' :
                      'text-gray-600 bg-gray-50'
                    }`}>
                      <MessageSquare className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nome e timestamp */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.contact?.name || `+${conversation.contact?.phone}` || 'Contato sem nome'}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
                      </span>
                      <ConversationActionsDropdown 
                        conversationId={conversation.id}
                        contactId={conversation.contactId}
                        currentStatus={conversation.status || 'open'}
                      />
                    </div>
                  </div>

                  {/* Badge de mensagens não lidas */}
                  <div className="flex items-center justify-end mb-1">
                    {(conversation.unreadCount || 0) > 0 && (
                      <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                        {(conversation.unreadCount || 0) > 99 ? '99+' : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {/* Preview da última mensagem */}
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.messages?.[0] ? (
                      <>
                        {conversation.messages[0].isFromContact ? '' : 'Você: '}
                        {(() => {
                          const lastMessage = conversation.messages[0];
                          
                          if (lastMessage.messageType === 'image') {
                            return '📷 Imagem';
                          } else if (lastMessage.messageType === 'audio') {
                            return '🎵 Áudio';
                          } else if (lastMessage.messageType === 'video') {
                            return '🎥 Vídeo';
                          } else if (lastMessage.messageType === 'document') {
                            return '📄 Documento';
                          } else {
                            return lastMessage.content || 'Mensagem';
                          }
                        })()}
                      </>
                    ) : (
                      'Sem mensagens'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && !isLoading && (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          )}
          
          {/* Loading inicial */}
          {isLoading && (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-sm">Carregando contatos...</p>
            </div>
          )}
        </div>
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
              messages={messages || []}
              isLoadingMessages={isLoadingMessages}
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
        onSuccess={() => refetch()}
      />
    </div>
  );
}
