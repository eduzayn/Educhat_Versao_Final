import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Separator } from '@/shared/ui/ui/separator';
import { BackButton } from '@/shared/components/BackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/ui/form';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertContactSchema } from '@shared/schema';
import type { InsertContact } from '@shared/schema';
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
import { useChatStore } from '@/shared/store/store/chatStore';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels } from '@/shared/lib/hooks/useChannels';
import { Textarea } from '@/shared/ui/ui/textarea';
import { CHANNELS, STATUS_CONFIG } from '@/types/chat';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { ConversationActionsDropdown } from './components/ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './components/ConversationAssignmentDropdown';
import { CreateContactModal } from './components/CreateContactModal';
import { ContactSidebar } from './components/ContactSidebar';
import { ConversationFilters } from './components/ConversationFilters';
import { ConversationListHeader } from './components/ConversationListHeader';

export function InboxPageRefactored() {
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
  } = useConversations(1000, { 
    refetchInterval: false, // Desabilitar polling - usar WebSocket para tempo real
    staleTime: 30000 // Cache por 30 segundos para melhor performance
  }); // Carregar 1000 contatos
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

  // Verificar se WhatsApp está disponível para comunicação
  const isWhatsAppAvailable = zapiStatus?.connected && zapiStatus?.smartphoneConnected;

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
      const response = await fetch(`/api/deals?contactId=${contactId}`);
      if (response.ok) {
        const deals = await response.json();
        setContactDeals(Array.isArray(deals) ? deals : []);
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
    // Filtro por aba
    if (activeTab === 'inbox' && conversation.status === 'resolved') return false;
    if (activeTab === 'resolved' && conversation.status !== 'resolved') return false;
    
    // Filtro por busca - pesquisar em nome e telefone do contato
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = conversation.contact.name.toLowerCase().includes(searchLower);
      const phoneMatch = conversation.contact.phone?.toLowerCase().includes(searchLower) || false;
      const emailMatch = conversation.contact.email?.toLowerCase().includes(searchLower) || false;
      
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
    const channelInfo = CHANNELS[channel as keyof typeof CHANNELS];
    return channelInfo || { icon: '💬', color: 'text-gray-500', name: 'Outro' };
  };

  const getSpecificChannelName = (conversation: any) => {
    // Prioriza busca por channelId específico (escalável para qualquer número de canais)
    if (conversation.channelId) {
      const channel = channels.find(c => c.id === conversation.channelId);
      if (channel) {
        // Para WhatsApp, mostra apenas o nome do canal
        // Para outros tipos, mostra "Tipo - Nome"
        return channel.type === 'whatsapp' 
          ? channel.name 
          : `${channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} - ${channel.name}`;
      }
    }
    
    // Se há equipe atribuída, usa o macrosetor para inferir o canal
    if (conversation.assignedTeamId) {
      const team = teams.find((t: any) => t.id === conversation.assignedTeamId);
      if (team) {
        // Mapeia macrosetor para nome de canal correspondente
        const macrosetorToChannel = {
          'comercial': 'Comercial',
          'suporte': 'Suporte',
          'cobranca': 'Cobrança',
          'secretaria': 'Secretaria',
          'tutoria': 'Tutoria'
        };
        return macrosetorToChannel[team.macrosetor as keyof typeof macrosetorToChannel] || team.name;
      }
    }
    
    // Fallback para conversas sem channelId específico
    const channelType = conversation.channel || 'unknown';
    if (channelType === 'whatsapp') {
      // Se há múltiplos canais WhatsApp, tenta identificar por outros critérios
      const whatsappChannels = channels.filter(c => c.type === 'whatsapp' && c.isActive);
      if (whatsappChannels.length > 1) {
        // Usa critérios como phone number pattern ou outros identificadores
        const phoneNumber = conversation.contact?.phoneNumber || '';
        
        // Lógica extensível: identifica canal baseado em padrões configuráveis
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
    
    return getChannelInfo(channelType).name;
  };

  const getChannelStyle = (conversation: any) => {
    if (conversation.channelId) {
      const channel = channels.find(c => c.id === conversation.channelId);
      if (channel?.type === 'whatsapp') {
        // Cores dinâmicas baseadas no hash do nome do canal para consistência
        const hash = channel.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const colors = [
          'bg-green-100 text-green-700',
          'bg-blue-100 text-blue-700', 
          'bg-purple-100 text-purple-700',
          'bg-orange-100 text-orange-700',
          'bg-pink-100 text-pink-700',
          'bg-indigo-100 text-indigo-700'
        ];
        return colors[hash % colors.length];
      }
    }
    
    // Se há equipe atribuída, usa cores baseadas no macrosetor
    if (conversation.assignedTeamId) {
      const team = teams.find((t: any) => t.id === conversation.assignedTeamId);
      if (team) {
        const macrosetorColors = {
          'comercial': 'bg-blue-100 text-blue-700',
          'suporte': 'bg-pink-100 text-pink-700', 
          'cobranca': 'bg-orange-100 text-orange-700',
          'secretaria': 'bg-purple-100 text-purple-700',
          'tutoria': 'bg-green-100 text-green-700'
        };
        return macrosetorColors[team.macrosetor as keyof typeof macrosetorColors] || 'bg-indigo-100 text-indigo-700';
      }
    }
    
    return 'bg-gray-100 text-gray-600';
  };

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
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
          {filteredConversations.map((conversation, index) => {
            const channelInfo = getChannelInfo(conversation.channel);
            const lastMessage = conversation.messages[0];
            const isActive = activeConversation?.id === conversation.id;
            
            // Usar contador de mensagens não lidas do banco de dados
            // Mostrar indicador mesmo para conversa ativa se foi marcada manualmente como não lida
            const unreadCount = conversation.unreadCount || 0;
            
            return (
              <div
                key={`conversation-${conversation.id}-${index}`}
                className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conversation.contact.profileImageUrl || ''} />
                    <AvatarFallback className="text-sm font-medium">
                      {conversation.contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.contact.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {lastMessage && lastMessage.sentAt && (
                          <span className="text-xs text-gray-400">
                            {formatTime(lastMessage.sentAt)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge className="bg-gray-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                        <ConversationActionsDropdown 
                          conversationId={conversation.id}
                          contactId={conversation.contactId}
                          currentStatus={conversation.status || 'open'}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {lastMessage ? (
                          lastMessage.messageType === 'image' ? (
                            lastMessage.isFromContact ? 'Imagem recebida' : 'Imagem enviada'
                          ) : lastMessage.messageType === 'audio' ? (
                            lastMessage.isFromContact ? 'Áudio recebido' : 'Áudio enviado'
                          ) : lastMessage.messageType === 'video' ? (
                            lastMessage.isFromContact ? 'Vídeo recebido' : 'Vídeo enviado'
                          ) : (
                            lastMessage.content || 'Mensagem sem texto'
                          )
                        ) : 'Sem mensagens'}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                        getChannelStyle(conversation)
                      }`}>
                        {getSpecificChannelName(conversation)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
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
            <div className="bg-white border-b border-gray-200 px-4 py-3 mobile-sticky mobile-p-reduced">
              <div className="flex items-center justify-between">
                {/* Mobile back button */}
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileChat(false)}
                    className="mr-2 touch-target"
                  >
                    ← Voltar
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={activeConversation.contact.profileImageUrl || ''} />
                    <AvatarFallback className="text-sm">
                      {activeConversation.contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-semibold text-gray-900 text-base">
                        {activeConversation.contact.name}
                      </h2>
                      <span className={`text-sm ${getChannelInfo(activeConversation.channel).color}`}>
                        {getChannelInfo(activeConversation.channel).icon}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <Select 
                        value={activeConversation.status || 'open'} 
                        onValueChange={(newStatus) => handleStatusChange(activeConversation.id, newStatus)}
                      >
                        <SelectTrigger className="h-6 w-auto border-0 p-1 text-xs bg-transparent">
                          <SelectValue>
                            <Badge 
                              variant="secondary" 
                              className={`${STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.bgColor} ${STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.color} text-xs`}
                            >
                              {STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.label || activeConversation.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Ativa
                            </Badge>
                          </SelectItem>
                          <SelectItem value="pending">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                              Aguardando
                            </Badge>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                              Em Andamento
                            </Badge>
                          </SelectItem>
                          <SelectItem value="resolved">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              Resolvida
                            </Badge>
                          </SelectItem>
                          <SelectItem value="closed">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                              Encerrada
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <ConversationActionsDropdown 
                    conversationId={activeConversation.id}
                    contactId={activeConversation.contactId}
                    currentStatus={activeConversation.status || 'open'}
                  />
                </div>
              </div>

              {/* Interface de Atribuição Manual */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <ConversationAssignmentDropdown
                  conversationId={activeConversation.id}
                  currentTeamId={activeConversation.assignedTeamId}
                  currentUserId={activeConversation.assignedUserId}
                  currentMacrosetor={activeConversation.macrosetor}
                />
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages || []).length === 0 && !isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie uma mensagem para começar a conversa</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading inicial */}
                  {isLoadingMessages && (
                    <div className="p-6 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                      <p className="text-sm">Carregando mensagens...</p>
                    </div>
                  )}
                  
                  {/* Lista de mensagens em ordem cronológica (mais antigas primeiro) */}
                  {(messages || []).map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      contact={activeConversation?.contact}
                      channelIcon={getChannelInfo(activeConversation?.channel || '').icon}
                      channelColor={getChannelInfo(activeConversation?.channel || '').color}
                      conversationId={activeConversation?.id || 0}
                      onReply={(message) => {
                        // Extrair messageId dos metadados da mensagem
                        const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata : {};
                        let messageId = null;
                        
                        if ("messageId" in metadata && metadata.messageId) {
                          messageId = metadata.messageId;
                        } else if ("zaapId" in metadata && metadata.zaapId) {
                          messageId = metadata.zaapId;
                        } else if ("id" in metadata && metadata.id) {
                          messageId = metadata.id;
                        }
                        
                        // Enviar evento para InputArea via custom event
                        window.dispatchEvent(new CustomEvent('replyToMessage', {
                          detail: { messageId, content: message.content }
                        }));
                      }}
                    />
                  ))}
                </>
              )}
            </div>

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
      
      <CreateContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        zapiStatus={zapiStatus}
      />
    </div>
  );
}
