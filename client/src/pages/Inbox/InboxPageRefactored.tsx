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
  

  const createContact = useCreateContact();
  const { toast } = useToast();
  

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    contactType: 'Lead',
    owner: '',
    notes: ''
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
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

  // Funções para manipular tags
  const handleAddTag = () => {
    if (currentTag.trim() && !newTags.includes(currentTag.trim())) {
      setNewTags([...newTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
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

  const handleCreateContact = async () => {
    try {
      // First, try to add contact to Z-API WhatsApp
      if (createForm.phone && isWhatsAppAvailable) {
        try {
          const [firstName, ...lastNameParts] = createForm.name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const response = await fetch("/api/zapi/contacts/add", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName,
              lastName,
              phone: createForm.phone
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add contact to WhatsApp: ${response.status}`);
          }
          
          toast({
            title: "Contato adicionado ao WhatsApp",
            description: "O contato foi adicionado à sua agenda do WhatsApp."
          });
        } catch (zapiError) {

          toast({
            title: "Aviso",
            description: "Contato criado no sistema, mas não foi possível adicionar ao WhatsApp.",
            variant: "destructive"
          });
        }
      }
      
      // Then create in local database
      await createContact.mutateAsync({
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone
      });
      
      toast({
        title: "Contato criado",
        description: isWhatsAppAvailable && createForm.phone 
          ? "Contato criado no sistema e adicionado ao WhatsApp." 
          : "Contato criado no sistema."
      });
      
      setIsModalOpen(false);
      setCreateForm({ 
        name: '', 
        email: '', 
        phone: '', 
        company: '', 
        address: '', 
        contactType: 'Lead', 
        owner: '', 
        notes: '' 
      });
      setNewTags([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    }
  };

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
        <div className="p-4 border-b border-gray-200">
          <BackButton to="/" label="Dashboard" className="mb-3" />
          
          {/* Header simplificado */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-educhat-dark">Conversas</h1>
            <div className="flex items-center gap-2">
              <ZApiStatusIndicator />
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    title="Novo contato"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Novo Contato</DialogTitle>
                  </DialogHeader>
                  
                  {/* Aviso sobre WhatsApp */}
                  {isWhatsAppAvailable && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-green-700 text-sm">
                        Contatos com telefone serão automaticamente adicionados ao seu WhatsApp
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome completo */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Nome completo</label>
                      <Input
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>

                    {/* Email e Telefone */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                      <Input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
                      <Input
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>

                    {/* Empresa e Tipo de contato */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
                      <Input
                        value={createForm.company}
                        onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
                      <Select value={createForm.contactType} onValueChange={(value) => setCreateForm({ ...createForm, contactType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Cliente">Cliente</SelectItem>
                          <SelectItem value="Parceiro">Parceiro</SelectItem>
                          <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Endereço */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
                      <Input
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    {/* Proprietário */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Proprietário</label>
                      <Select value={createForm.owner} onValueChange={(value) => setCreateForm({ ...createForm, owner: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o proprietário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="João da Silva">João da Silva</SelectItem>
                          <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                          <SelectItem value="Pedro Oliveira">Pedro Oliveira</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                      <div className="space-y-2">
                        {newTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newTags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <X 
                                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Nova tag"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            className="flex-1"
                          />
                          <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {newTags.length === 0 && (
                          <p className="text-sm text-gray-500">Nenhuma tag adicionada</p>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Notas</label>
                      <Textarea
                        value={createForm.notes}
                        onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                        placeholder="Adicione observações importantes sobre este contato"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsModalOpen(false);
                        setCreateForm({ 
                          name: '', 
                          email: '', 
                          phone: '', 
                          company: '', 
                          address: '', 
                          contactType: 'Lead', 
                          owner: '', 
                          notes: '' 
                        });
                        setNewTags([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateContact}
                      disabled={createContact.isPending || !createForm.name.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      {createContact.isPending ? 'Criando...' : 'Criar Contato'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Aviso quando Z-API não está conectada */}
          {!isWhatsAppAvailable && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700">
                  WhatsApp desconectado
                </span>
              </div>
            </div>
          )}
          
          {/* Busca */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          {/* Abas simplificadas */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="inbox" className="text-xs">Entrada</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="resolved" className="text-xs">Resolvidas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filtros compactos */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="resolved">Resolvida</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="whatsapp">WhatsApp (Todos)</SelectItem>
                {channels.filter(c => c.type === 'whatsapp' && c.isActive).map(channel => (
                  <SelectItem key={channel.id} value={`whatsapp-${channel.id}`}>
                    WhatsApp {channel.name}
                  </SelectItem>
                ))}
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation, index) => {
            const channelInfo = getChannelInfo(conversation.channel);
            const lastMessage = conversation.messages[0];
            const isActive = activeConversation?.id === conversation.id;
            
            // Usar contador de mensagens não lidas do banco de dados
            const unreadCount = !isActive ? (conversation.unreadCount || 0) : 0;
            
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
                          <Badge className="bg-purple-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
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

      {/* Painel de Detalhes do Contato */}
      {activeConversation && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            {/* Header do contato */}
            <div className="text-center mb-4">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src={activeConversation?.contact?.profileImageUrl || ''} />
                <AvatarFallback className="text-lg">
                  {activeConversation?.contact?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="font-semibold text-base text-gray-900 mb-1">
                {activeConversation?.contact?.name}
              </h3>
              
              <div className="flex items-center justify-center text-sm mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getChannelStyle(activeConversation)}`}>
                  {getSpecificChannelName(activeConversation)}
                </span>
              </div>
              
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                ✓ Ativa
              </Badge>
            </div>

            {/* Ações rápidas */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Phone className="w-3 h-3 mr-1" />
                Ligar
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Email
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 text-sm">
            {/* 👤 Identificação */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                <User className="w-4 h-4" />
                Identificação
              </h4>
              
              {activeConversation.contact.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {activeConversation.contact.phone}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
              )}
              
              {activeConversation.contact.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {activeConversation.contact.email}
                  </span>
                </div>
              )}
              
              {activeConversation.contact.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">{activeConversation.contact.location}</span>
                </div>
              )}
              
              {/* Informações do Canal */}
              {(activeConversation.contact.canalOrigem || activeConversation.channelId) && (
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-3 h-3 text-gray-400" />
                  <span className={`text-xs px-2 py-1 rounded-md ${getChannelStyle(activeConversation)}`}>
                    {getSpecificChannelName(activeConversation) || 
                     activeConversation.contact.nomeCanal || 
                     activeConversation.contact.canalOrigem ||
                     'Canal não identificado'}
                  </span>
                </div>
              )}
            </div>

            {/* 🎓 Informações Acadêmicas */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                🎓 Informações Acadêmicas
              </h4>
              
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Canal:</span>
                  <span className="font-medium text-blue-800">
                    {activeConversation.contact.canalOrigem ? 
                      activeConversation.contact.canalOrigem.charAt(0).toUpperCase() + 
                      activeConversation.contact.canalOrigem.slice(1) : 
                      'WhatsApp'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">
                    {activeConversation.contact.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversas:</span>
                  <span className="font-medium">{activeConversation.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Idade:</span>
                  <span className="font-medium">
                    {activeConversation.contact.age || 'Não informado'}
                  </span>
                </div>
              </div>
            </div>

            {/* 📝 Histórico */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Histórico
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primeira conversa:</span>
                  <span className="font-medium text-xs">
                    {new Intl.DateTimeFormat('pt-BR').format(new Date(activeConversation.contact.createdAt || new Date()))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Último atendimento:</span>
                  <span className="font-medium text-xs">
                    {activeConversation.lastMessageAt ? 
                      new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(activeConversation.lastMessageAt)) :
                      'Nunca'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de mensagens:</span>
                  <span className="font-medium">{activeConversation.messages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{activeConversation.status || 'Ativo'}</span>
                </div>
              </div>
            </div>

            {/* 🔖 Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {/* Tags do canal de origem */}
                {activeConversation.contact.canalOrigem && (
                  <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 hover:bg-purple-200">
                    {activeConversation.contact.canalOrigem.charAt(0).toUpperCase() + activeConversation.contact.canalOrigem.slice(1)}
                  </Badge>
                )}
                
                {/* Tags dos negócios */}
                {Array.isArray(contactDeals) && contactDeals.map((deal) => {
                  if (deal.tags && Array.isArray(deal.tags)) {
                    return deal.tags.map((tag: string, index: number) => (
                      <Badge key={`${deal.id}-${index}`} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {tag}
                      </Badge>
                    ));
                  }
                  return null;
                }).filter(Boolean)}
                
                {/* Tag de status online */}
                {activeConversation.contact.isOnline && (
                  <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 hover:bg-green-200">
                    Online
                  </Badge>
                )}
                
                {/* Se não há tags, mostrar mensagem */}
                {contactDeals.length === 0 && !activeConversation.contact.canalOrigem && (
                  <span className="text-xs text-gray-500 italic">Nenhuma tag encontrada</span>
                )}
              </div>
            </div>

            {/* 🎓 Formação Acadêmica */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                🎓 Formação Acadêmica
              </h4>
              
              {/* Cursos que já possui (Formado em) */}
              {activeConversation.contact.tags && Array.isArray(activeConversation.contact.tags) && 
               activeConversation.contact.tags.some((tag: string) => tag.startsWith('Formado:')) && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Já possui formação em:
                  </h5>
                  <div className="space-y-1">
                    {activeConversation.contact.tags
                      .filter((tag: string) => tag.startsWith('Formado:'))
                      .map((tag: string, index: number) => (
                        <div key={`formado-${index}`} className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                          <p className="text-sm font-medium text-blue-800">
                            {tag.replace('Formado: ', '')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Cursos que deseja fazer (Interesse em) */}
              {activeConversation.contact.tags && Array.isArray(activeConversation.contact.tags) && 
               activeConversation.contact.tags.some((tag: string) => tag.startsWith('Interesse:')) && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Tem interesse em:
                  </h5>
                  <div className="space-y-1">
                    {activeConversation.contact.tags
                      .filter((tag: string) => tag.startsWith('Interesse:'))
                      .map((tag: string, index: number) => (
                        <div key={`interesse-${index}`} className="bg-green-50 border border-green-200 p-2 rounded-md">
                          <p className="text-sm font-medium text-green-800">
                            {tag.replace('Interesse: ', '')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Cursos detectados via API (fallback) */}
              {contactInterests.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Detectados automaticamente:
                  </h5>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {contactInterests.map((interest) => (
                      <div key={interest.id} className="bg-gray-50 border border-gray-200 p-2 rounded-md">
                        <p className="text-sm font-medium text-gray-800">
                          {interest.courseName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(interest.detectedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem quando não há cursos detectados */}
              {(!activeConversation.contact.tags || 
                !Array.isArray(activeConversation.contact.tags) || 
                !activeConversation.contact.tags.some((tag: string) => 
                  tag.startsWith('Formado:') || tag.startsWith('Interesse:')
                )) && 
               contactInterests.length === 0 && (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    Nenhum curso detectado ainda
                  </p>
                </div>
              )}
            </div>

            {/* 💬 Notas internas */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                💬 Notas internas
              </h4>
              
              {contactNotes.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {contactNotes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 mb-2">
                        "{note.content}"
                      </p>
                      <p className="text-xs text-gray-500">
                        Por {note.authorName} • {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    Nenhuma nota interna ainda
                  </p>
                </div>
              )}
              
              <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar nota
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Nova Nota Interna</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Nota para: {activeConversation?.contact.name}
                      </label>
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Digite sua anotação aqui... (Ex: Solicitou boleto dia 25/05 – retorno agendado para 28/05)"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 Esta nota será visível apenas para a equipe interna e ficará anexada ao perfil do contato.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowNoteDialog(false);
                        setNewNote('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Salvar nota
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 📦 Resumo Estatístico */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Resumo</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="font-semibold text-purple-700">
                    {activeConversation.messages?.length || 0}
                  </div>
                  <div className="text-purple-600">Mensagens</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="font-semibold text-green-700">
                    {contactDeals.length}
                  </div>
                  <div className="text-green-600">Negócios</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="font-semibold text-blue-700">
                    {contactNotes.length}
                  </div>
                  <div className="text-blue-600">Notas</div>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <div className="font-semibold text-orange-700">
                    {activeConversation.contact.isOnline ? 'On' : 'Off'}
                  </div>
                  <div className="text-orange-600">Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}