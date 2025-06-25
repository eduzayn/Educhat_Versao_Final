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

import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels, Channel } from '@/shared/lib/hooks/useChannels';

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
import { ConversationItem } from './components/ConversationItem';
import { ChatHeader } from './components/ChatHeader';
import { MessagesArea } from './components/MessagesArea';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

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
  
  // Inicializar WebSocket para mensagens em tempo real com notificações
  useWebSocket();
  
  const { 
    data: conversationsData, 
    isLoading, 
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch 
  } = useConversations(20, { 
    refetchInterval: false, // WebSocket cuida das atualizações - sem polling
    staleTime: 60000, // Cache por 1 minuto para reduzir requisições
    refetchOnWindowFocus: false // Evitar requisições ao trocar de aba
  }); // Carregar 20 conversas iniciais, mais 20 por vez
  
  // Flatten das páginas de conversas com verificação de segurança
  const conversations = conversationsData?.pages ? conversationsData.pages.flatMap(page => page || []) : [];
  
  // Estado local para conversa ativa (substituindo Zustand)
  const [activeConversation, setActiveConversation] = useState<any>(null);
  
  // Query para dados atualizados da conversa ativa - FONTE ÚNICA DE VERDADE
  const { data: activeConversationData } = useQuery({
    queryKey: ['/api/conversations', activeConversation?.id],
    queryFn: async ({ queryKey }) => {
      const conversationId = queryKey[1];
      if (!conversationId) return null;
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Erro ao carregar conversa');
      return response.json();
    },
    enabled: !!activeConversation?.id,
    staleTime: 120000, // Cache por 2 minutos - WebSocket atualiza quando necessário
    refetchInterval: false, // Sem polling - WebSocket cuida das atualizações
    refetchOnWindowFocus: false // Evitar requisições ao trocar de aba
  });
  
  // Usar dados atualizados da query ou fallback para dados locais
  const currentActiveConversation = activeConversationData || activeConversation;
  
  // Hook de mensagens com scroll infinito invertido - FONTE ÚNICA DE VERDADE
  const messagesQuery = useMessages(currentActiveConversation?.id, 15);
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    hasNextPage: messagesHasNextPage,
    isFetchingNextPage: messagesIsFetchingNextPage,
    fetchNextPage: messagesFetchNextPage,
    refetch: refetchMessages 
  } = messagesQuery;
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    // Marcar como lida apenas na API - React Query é fonte única
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };
  
  // FONTE ÚNICA: Apenas React Query - sem merge com store
  const messages = Array.isArray(messagesData?.pages) 
    ? messagesData.pages.flatMap(page => page || []).sort((a, b) => 
        new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()
      )
    : [];

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
      if (!activeStatuses.includes(conversation.status)) return false;
    }
    if (activeTab === 'resolved') {
      // Mostrar apenas conversas resolvidas/fechadas
      const resolvedStatuses = ['resolved', 'closed'];
      if (!resolvedStatuses.includes(conversation.status)) return false;
    }
    
    // Filtro por busca - pesquisar em nome, telefone e email do contato
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = conversation.contact.name?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = conversation.contact.phone?.includes(searchTerm) || false; // Números não precisam lowercase
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

  const getSpecificChannelName = (conversation: any) => {
    // Mapeamento padronizado de categorias para nomes de canal
    const standardChannelNames = {
      'comercial': 'Comercial',
      'suporte': 'Suporte',
      'cobranca': 'Cobrança',
      'secretaria': 'Secretaria',
      'tutoria': 'Tutoria'
    };

    // PRIORIDADE 1: Busca por channelId específico
    if (conversation.channelId) {
      const channel = channels.find(c => c.id === conversation.channelId);
      if (channel) {
        return channel.type === 'whatsapp' 
          ? channel.name 
          : `${channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} - ${channel.name}`;
      }
    }
    
    // PRIORIDADE 2: Se há equipe atribuída, usa a categoria padronizada
    if (conversation.assignedTeamId) {
      const team = teams.find((t: any) => t.id === conversation.assignedTeamId);
      if (team && team.category && standardChannelNames[team.category as keyof typeof standardChannelNames]) {
        return standardChannelNames[team.category as keyof typeof standardChannelNames];
      }
      // Fallback para equipes sem categoria definida
      if (team) {
        return team.name;
      }
    }
    
    // PRIORIDADE 3: Fallback para conversas sem channelId específico
    const channelType = conversation.channel || 'unknown';
    if (channelType === 'whatsapp') {
      const whatsappChannels = channels.filter(c => c.type === 'whatsapp' && c.isActive);
      if (whatsappChannels.length > 1) {
        const phoneNumber = conversation.contact?.phoneNumber || '';
        
        // Tenta identificar canal baseado em padrões configuráveis
        for (const channel of whatsappChannels) {
          const config = channel.configuration as any;
          if (config?.phonePattern && phoneNumber.includes(config.phonePattern)) {
            return channel.name;
          }
        }
        
        // Fallback: usa primeiro canal ativo disponível
        return whatsappChannels[0]?.name || 'WhatsApp';
      }
      return whatsappChannels[0]?.name || 'WhatsApp';
    }
    
    return getChannelInfo(channelType).label;
  };

  const getChannelStyle = (conversation: any) => {
    // Definir cores padronizadas uma única vez
    const standardColors = {
      'comercial': 'bg-blue-100 text-blue-700',
      'suporte': 'bg-pink-100 text-pink-700', 
      'cobranca': 'bg-orange-100 text-orange-700',
      'secretaria': 'bg-purple-100 text-purple-700',
      'tutoria': 'bg-green-100 text-green-700'
    };

    // PRIORIDADE 1: Se há equipe atribuída, sempre usa cores baseadas na categoria
    if (conversation.assignedTeamId) {
      const team = teams.find((t: any) => t.id === conversation.assignedTeamId);
      if (team && team.category && standardColors[team.category as keyof typeof standardColors]) {
        return standardColors[team.category as keyof typeof standardColors];
      }
    }
    
    // PRIORIDADE 2: Se há channelId, usa cores baseadas no nome do canal
    if (conversation.channelId) {
      const channel = channels.find(c => c.id === conversation.channelId);
      if (channel?.type === 'whatsapp') {
        const channelLower = channel.name.toLowerCase();
        
        // Usar mesmas cores padronizadas para manter consistência
        for (const [keyword, color] of Object.entries(standardColors)) {
          if (channelLower.includes(keyword)) {
            return color;
          }
        }
        
        // Fallback: cor neutra para canais não mapeados
        return 'bg-gray-100 text-gray-600';
      }
    }
    
    // PRIORIDADE 3: Fallback baseado no nome específico do canal para conversas antigas
    const channelName = getSpecificChannelName(conversation);
    if (channelName) {
      const channelNameLower = channelName.toLowerCase();
      for (const [keyword, color] of Object.entries(standardColors)) {
        if (channelNameLower.includes(keyword)) {
          return color;
        }
      }
    }
    
    return 'bg-gray-100 text-gray-600';
  };

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

        {/* Lista de Conversas com Scroll Infinito */}
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            // Carregar mais quando estiver próximo ao final (100px antes do fim)
            if (scrollHeight - scrollTop <= clientHeight + 100) {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }
          }}
        >
          {filteredConversations.map((conversation, index) => (
            <ConversationItem
              key={`conversation-${conversation.id}-${index}`}
              conversation={conversation}
              index={index}
              isActive={activeConversation?.id === conversation.id}
              onSelect={handleSelectConversation}
              formatTime={formatTime}
              getChannelStyle={getChannelStyle}
              getSpecificChannelName={getSpecificChannelName}
            />
          ))}
          
          {/* Loading para mais conversas */}
          {isFetchingNextPage && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-xs">Carregando mais conversas...</p>
            </div>
          )}
          
          {/* Indicador de fim */}
          {!hasNextPage && conversations.length > 0 && (
            <div className="p-4 text-center text-gray-400">
              <p className="text-xs">Todas as conversas foram carregadas</p>
            </div>
          )}
          
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
              <p className="text-sm">Carregando conversas...</p>
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
              activeConversation={currentActiveConversation}
              showMobileChat={showMobileChat}
              onMobileBackClick={() => setShowMobileChat(false)}
              onStatusChange={handleStatusChange}
              getChannelInfo={getChannelInfo}
            />

            {/* Mensagens */}
            <MessagesArea
              messages={Array.isArray(messages) ? messages : []}
              isLoadingMessages={isLoadingMessages}
              hasNextPage={messagesHasNextPage}
              isFetchingNextPage={messagesIsFetchingNextPage}
              fetchNextPage={messagesFetchNextPage}
              activeConversation={currentActiveConversation}
              getChannelInfo={getChannelInfo}
            />

            {/* Área de Input */}
            <InputArea activeConversation={currentActiveConversation} />
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
