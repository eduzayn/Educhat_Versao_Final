import { useState, useEffect, useMemo } from 'react';
import { CACHE_CONFIG } from '@/lib/cacheConfig';
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
import { useSearchConversations } from '@/shared/lib/hooks/useSearchConversations';

import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels, Channel } from '@/shared/lib/hooks/useChannels';
import { useSystemUsers } from '@/shared/lib/hooks/useSystemUsers';
import { formatTimeOnly } from '@/shared/lib/utils/formatters';

import { STATUS_CONFIG } from '@/types/chat';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { ConversationActionsDropdown } from './components/ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './components/ConversationAssignmentDropdown';
import { ContactSidebar } from './components/ContactSidebar';
import { ConversationFilters } from './components/ConversationFilters';
import { AdvancedFiltersPanel } from './components/AdvancedFiltersPanel';
import { ConversationListHeader } from './components/ConversationListHeader';
import { ConversationItem } from './components/ConversationItem';
import { ChatHeader } from './components/ChatHeader';
import { MessagesArea } from './components/MessagesArea';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

export function InboxPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [channelFilter, setChannelFilter] = useState('all');
  const [canalOrigemFilter, setCanalOrigemFilter] = useState('all');
  const [nomeCanalFilter, setNomeCanalFilter] = useState('all');
  
  // Estados para filtros avançados
  const [userFilter, setUserFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  
  const { data: channels = [] } = useChannels();
  const { data: systemUsers = [] } = useSystemUsers();
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Carregar equipes para identificação de canais
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    },
    staleTime: 300000, // Cache válido por 5 minutos
    refetchOnWindowFocus: false, // Evitar requisições ao trocar de aba
    refetchInterval: false, // WebSocket atualiza quando necessário
  });
  
  // Integração com Z-API para comunicação em tempo real
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  
  // Inicializar WebSocket para mensagens em tempo real com notificações
  useWebSocket();
  
  // Construir filtros para a API backend baseado nos filtros avançados
  const apiFilters = useMemo(() => {
    const filters: any = {};
    
    // Filtro por usuário
    if (userFilter !== 'all') {
      if (userFilter === 'unassigned') {
        filters.unassigned = true;
      } else {
        filters.userId = parseInt(userFilter);
      }
    }
    
    // Filtro por equipe (apenas se não há filtro de usuário)
    if (teamFilter !== 'all' && userFilter === 'all') {
      if (teamFilter === 'unassigned') {
        filters.unassigned = true;
      } else {
        filters.teamId = parseInt(teamFilter);
      }
    }
    
    return filters;
  }, [userFilter, teamFilter]);

  const { 
    data: conversationsData, 
    isLoading, 
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch 
  } = useConversations(8, apiFilters, CACHE_CONFIG.CONVERSATIONS); // OTIMIZAÇÃO: apenas 8 conversas iniciais para carregamento ultra-rápido
  
  // Flatten das páginas de conversas com verificação de segurança
  const conversations = conversationsData?.pages ? conversationsData.pages.flatMap(page => page || []) : [];
  
  // Estado local para conversa ativa (substituindo Zustand)
  const [activeConversation, setActiveConversation] = useState<any>(null);
  
  // Query para dados atualizados da conversa ativa - FONTE ÚNICA DE VERDADE
  const { data: activeConversationData, error: conversationError, isError: isConversationError } = useQuery({
    queryKey: ['/api/conversations', activeConversation?.id],
    queryFn: async ({ queryKey }) => {
      const conversationId = queryKey[1];
      if (!conversationId) return null;
      
      const response = await fetch(`/api/conversations/${conversationId}`);
      
      if (!response.ok) {
        // Tratamento específico para diferentes tipos de erro
        if (response.status === 404) {
          console.warn(`Conversa ${conversationId} não encontrada - removendo da seleção`);
          return null;
        }
        if (response.status === 400) {
          console.error(`ID de conversa inválido: ${conversationId}`);
          return null;
        }
        // Para erros 500, tentar fallback
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(`Erro ${response.status}: ${errorData.message || 'Falha ao carregar conversa'}`);
      }
      
      return response.json();
    },
    enabled: !!activeConversation?.id,
    ...CACHE_CONFIG.CONVERSATIONS, // Usar configuração padronizada
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros 404 ou 400
      if (error?.message?.includes('404') || error?.message?.includes('400')) {
        return false;
      }
      // Máximo 2 tentativas para erros 500
      return failureCount < 2;
    }
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

  // Estado para controlar quais conversas já foram marcadas como lidas nesta sessão
  const [markedAsReadIds, setMarkedAsReadIds] = useState<Set<number>>(new Set());

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    
    // CONTROLE ANTI-429: Marcar como lida APENAS se necessário
    const needsMarkAsRead = 
      (conversation.unreadCount > 0 || !conversation.isRead) && // Tem mensagens não lidas OU não está marcada como lida
      !markedAsReadIds.has(conversation.id); // E não foi marcada nesta sessão
    
    if (needsMarkAsRead) {
      console.log(`📖 Marcando conversa ${conversation.id} como lida:`, {
        conversationId: conversation.id,
        contactName: conversation.contact?.name,
        unreadCount: conversation.unreadCount,
        isRead: conversation.isRead,
        markedUnreadManually: conversation.markedUnreadManually,
        alreadyMarkedInSession: markedAsReadIds.has(conversation.id)
      });
      
      // Adicionar ao set de IDs já processados ANTES da requisição
      setMarkedAsReadIds(prev => {
        const newSet = new Set(prev);
        newSet.add(conversation.id);
        return newSet;
      });
      
      // Fazer a requisição apenas uma vez
      markAsReadMutation.mutate(conversation.id);
    } else {
      console.log(`⏭️ Conversa ${conversation.id} não precisa ser marcada como lida:`, {
        conversationId: conversation.id,
        contactName: conversation.contact?.name,
        unreadCount: conversation.unreadCount,
        isRead: conversation.isRead,
        markedUnreadManually: conversation.markedUnreadManually,
        alreadyMarkedInSession: markedAsReadIds.has(conversation.id)
      });
    }
    
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

  // Busca no banco de dados completo quando há termo de busca
  const { data: searchResults, isLoading: isSearching } = useSearchConversations(searchTerm);

  // Log para debug da busca
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      console.log(`🔍 [InboxPage] Busca ativa por: "${searchTerm}"`, {
        searchResults: searchResults?.length || 0,
        isSearching,
        filtrosAtivos: { statusFilter, channelFilter, userFilter, teamFilter }
      });
    }
  }, [searchTerm, searchResults, isSearching]);

  // Log para debug da filtragem
  useEffect(() => {
    if (searchTerm && searchTerm.trim() && searchResults) {
      console.log(`🔍 [InboxPage] Filtragem final:`, {
        termo: searchTerm,
        conversasRecebidas: searchResults.length,
        conversasFiltradas: filteredConversations.length,
        primeiraConversa: searchResults[0] ? {
          id: searchResults[0].id,
          nome: searchResults[0].contact?.name,
          telefone: searchResults[0].contact?.phone
        } : null
      });
    }
  }, [searchTerm, searchResults, filteredConversations]);

  // Determinar quais conversas usar: busca no banco ou lista local
  const conversationsToFilter = searchTerm && searchTerm.trim() 
    ? (searchResults || []) 
    : (conversations || []);

  // Função para verificar se uma conversa está dentro do período selecionado
  const isConversationInPeriod = (conversation: any) => {
    if (periodFilter === 'all') return true;
    
    const conversationDate = new Date(conversation.lastMessageAt || conversation.createdAt);
    
    switch (periodFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        return conversationDate >= today && conversationDate <= todayEnd;
        
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return conversationDate >= yesterday && conversationDate <= yesterdayEnd;
        
      case 'last7days':
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        return conversationDate >= last7Days;
        
      case 'last30days':
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        return conversationDate >= last30Days;
        
      case 'custom':
        if (!customDateFrom && !customDateTo) return true;
        if (customDateFrom && !customDateTo) {
          return conversationDate >= customDateFrom;
        }
        if (!customDateFrom && customDateTo) {
          const endOfDay = new Date(customDateTo);
          endOfDay.setHours(23, 59, 59, 999);
          return conversationDate <= endOfDay;
        }
        if (customDateFrom && customDateTo) {
          const endOfDay = new Date(customDateTo);
          endOfDay.setHours(23, 59, 59, 999);
          return conversationDate >= customDateFrom && conversationDate <= endOfDay;
        }
        return true;
        
      default:
        return true;
    }
  };

  // Função para lidar com mudanças de datas personalizadas
  const handleCustomDateChange = (from?: Date, to?: Date) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
  };

  // Filtrar conversas baseado na aba ativa e filtros (incluindo filtros avançados)
  const filteredConversations = conversationsToFilter.filter((conversation: any) => {
    // Validação básica de segurança
    if (!conversation || !conversation.contact) return false;
    
    // CORREÇÃO CRÍTICA: Se há busca ativa, mostrar TODOS os resultados sem aplicar nenhum filtro
    if (searchTerm && searchTerm.trim()) {
      return true; // Mostrar todos os resultados de busca sem filtros
    }
    
    // Filtro por aba - conversas reabertas devem aparecer na inbox
    if (activeTab === 'inbox') {
      const activeStatuses = ['open', 'pending', 'unread'];
      if (!conversation.status || !activeStatuses.includes(conversation.status)) return false;
    }
    if (activeTab === 'resolved') {
      const resolvedStatuses = ['resolved', 'closed'];
      if (!conversation.status || !resolvedStatuses.includes(conversation.status)) return false;
    }
    
    // Filtro por status (filtros básicos)
    if (statusFilter !== 'all' && conversation.status !== statusFilter) return false;
    
    // Filtro por canal (filtros básicos)
    if (channelFilter !== 'all') {
      if (channelFilter === conversation.channel) {
        // Corresponde ao tipo de canal
      } else if (channelFilter === 'whatsapp') {
        // Filtro "WhatsApp (Todos)" - inclui todos os canais WhatsApp
        if (!['whatsapp', 'comercial', 'suporte'].includes(conversation.channel)) {
          return false;
        }
      } else if (channelFilter.startsWith('whatsapp-')) {
        // Filtro específico de canal WhatsApp
        const specificChannelId = parseInt(channelFilter.replace('whatsapp-', ''));
        if (conversation.channelId !== specificChannelId) {
          return false;
        }
      } else {
        return false;
      }
    }
    
    // FILTROS AVANÇADOS
    
    // Filtro por usuário atribuído
    if (userFilter !== 'all') {
      if (userFilter === 'unassigned') {
        if (conversation.assignedUserId) return false;
      } else {
        const userId = parseInt(userFilter);
        if (conversation.assignedUserId !== userId) return false;
      }
    }
    
    // Filtro por equipe
    if (teamFilter !== 'all') {
      if (teamFilter === 'unassigned') {
        if (conversation.assignedTeamId) return false;
      } else {
        const teamId = parseInt(teamFilter);
        if (conversation.assignedTeamId !== teamId) return false;
      }
    }
    
    // Filtro por período
    if (!isConversationInPeriod(conversation)) return false;
    
    return true;
  });



  const getChannelInfo = (channel: string) => {
    // Channel info now handled by backend data
    return { icon: '💬', color: 'text-gray-500', label: 'Canal' };
  };

  const getSpecificChannelName = (conversation: any) => {
    // ETAPA 2: PRIORIDADE ÚNICA - Nome da equipe atribuída
    // A tag lateral deve sempre mostrar a equipe responsável atual
    if (conversation.assignedTeamId) {
      const team = teams.find((t: any) => t.id === conversation.assignedTeamId);
      if (team) {
        return team.name; // Sempre usar o nome configurado da equipe
      }
    }
    
    // FALLBACK: Conversa sem atribuição de equipe
    return 'Sem Atribuição';
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
      <div className={`w-96 md:w-96 ${showMobileChat ? 'mobile-hide' : 'mobile-full-width'} bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <ConversationListHeader
          activeTab={activeTab}
          searchTerm={searchTerm}
          isWhatsAppAvailable={isWhatsAppAvailable}
          periodFilter={periodFilter}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          onTabChange={setActiveTab}
          onSearchChange={setSearchTerm}
          onNewContactClick={() => setIsModalOpen(true)}
          onRefresh={() => refetch()}
          onPeriodFilterChange={setPeriodFilter}
          onCustomDateChange={handleCustomDateChange}
        />

        {/* Filtros compactos */}
        <ConversationFilters
          statusFilter={statusFilter}
          channelFilter={channelFilter}
          onStatusFilterChange={setStatusFilter}
          onChannelFilterChange={setChannelFilter}
          channels={channels}
        />

        {/* Painel de filtros avançados */}
        <AdvancedFiltersPanel
          userFilter={userFilter}
          teamFilter={teamFilter}
          periodFilter={periodFilter}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          onUserFilterChange={setUserFilter}
          onTeamFilterChange={setTeamFilter}
          onPeriodFilterChange={setPeriodFilter}
          onCustomDateChange={handleCustomDateChange}
          teams={teams || []}
          users={systemUsers || []}
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
          {/* CORREÇÃO: Usar 'conversations' (dados da API com paginação) ao invés de 'filteredConversations' (filtro local) */}
          {conversations.map((conversation: any, index: number) => (
            <ConversationItem
              key={`conv-${conversation.id}-${conversation.contactId}-${index}`}
              conversation={conversation}
              index={index}
              isActive={activeConversation?.id === conversation.id}
              onSelect={handleSelectConversation}
              formatTime={formatTimeOnly}
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
            {/* Estado de erro para conversa indisponível */}
            {isConversationError ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 max-w-md">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Conversa indisponível
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Esta conversa não pôde ser carregada. Pode estar corrompida ou ter sido removida.
                  </p>
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Selecionar outra conversa
                  </button>
                </div>
              </div>
            ) : !currentActiveConversation ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Carregando conversa...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Aguarde enquanto carregamos os dados da conversa.
                  </p>
                </div>
              </div>
            ) : (
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
                />

                {/* Área de Input */}
                <InputArea activeConversation={currentActiveConversation} />
              </>
            )}
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
        onDealUpdated={() => {
          if (activeConversation?.contactId) {
            fetchContactDeals(activeConversation.contactId);
          }
        }}
      />
      
      <ContactDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
