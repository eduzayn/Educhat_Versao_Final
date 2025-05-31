import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Separator } from '@/shared/ui/ui/separator';
import { BackButton } from '@/shared/components/BackButton';

import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
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
import { CHANNELS, STATUS_CONFIG } from '@/types/chat';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';

export function InboxPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  // Integração com Z-API para comunicação em tempo real
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  
  const { data: conversations = [], isLoading } = useConversations();
  const { activeConversation, setActiveConversation } = useChatStore();
  const { data: messages = [] } = useMessages(activeConversation?.id || null);

  // Verificar se WhatsApp está disponível para comunicação
  const isWhatsAppAvailable = zapiStatus?.connected && zapiStatus?.smartphoneConnected;

  // Filtrar conversas baseado na aba ativa e filtros
  const filteredConversations = conversations.filter(conversation => {
    // Filtro por aba
    if (activeTab === 'inbox' && conversation.status === 'resolved') return false;
    if (activeTab === 'resolved' && conversation.status !== 'resolved') return false;
    
    // Filtro por busca
    if (searchTerm && !conversation.contact.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro por status
    if (statusFilter !== 'all' && conversation.status !== statusFilter) return false;
    
    // Filtro por canal
    if (channelFilter !== 'all' && conversation.channel !== channelFilter) return false;
    
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

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Lista de Conversas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <BackButton to="/" label="Dashboard" className="mb-3" />
          
          {/* Header simplificado */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-educhat-dark">Conversas</h1>
            <div className="flex items-center gap-2">
              <ZApiStatusIndicator />
              <Link href="/contacts">
                <Button 
                  size="sm" 
                  variant="outline"
                  title="Novo contato"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const channelInfo = getChannelInfo(conversation.channel);
            const lastMessage = conversation.messages[0];
            const isActive = activeConversation?.id === conversation.id;
            
            return (
              <div
                key={conversation.id}
                className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={conversation.contact.profileImageUrl || ''} />
                      <AvatarFallback className="text-sm">
                        {conversation.contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full text-xs flex items-center justify-center ${channelInfo.color}`}>
                      {channelInfo.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate text-sm">
                        {conversation.contact.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatTime(lastMessage.sentAt || new Date())}
                          </span>
                        )}
                        {getStatusBadge(conversation.status)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate">
                      {lastMessage?.content || 'Sem mensagens'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
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
                      <span className="text-xs text-gray-500">
                        {getChannelInfo(activeConversation.channel).name}
                      </span>
                      <span className="text-gray-300">•</span>
                      {getStatusBadge(activeConversation.status)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie uma mensagem para começar a conversa</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    contact={activeConversation.contact}
                    channelIcon={getChannelInfo(activeConversation.channel).icon}
                    channelColor={getChannelInfo(activeConversation.channel).color}
                  />
                ))
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
        <div className="w-64 bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-100">
            {/* Header do contato */}
            <div className="text-center mb-4">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src={activeConversation.contact.profileImageUrl || ''} />
                <AvatarFallback className="text-lg">
                  {activeConversation.contact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="font-semibold text-base text-gray-900 mb-1">
                {activeConversation.contact.name}
              </h3>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className={getChannelInfo(activeConversation.channel).color}>
                  {getChannelInfo(activeConversation.channel).icon}
                </span>
                <span>{getChannelInfo(activeConversation.channel).name}</span>
              </div>
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

          <div className="p-4 space-y-4">
            {/* Informações essenciais */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900">Contato</h4>
              
              {activeConversation.contact.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {activeConversation.contact.phone}
                  </span>
                </div>
              )}
              
              {activeConversation.contact.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {activeConversation.contact.email}
                  </span>
                </div>
              )}
            </div>

            {/* Tags compactas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-900">Tags</h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">Lead</Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">Ativo</Badge>
              </div>
            </div>

            {/* Estatísticas simplificadas */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Resumo</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mensagens:</span>
                  <span className="font-medium">{activeConversation.messages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(activeConversation.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente desde:</span>
                  <span className="font-medium text-xs">
                    {new Intl.DateTimeFormat('pt-BR', {
                      month: 'short',
                      year: 'numeric'
                    }).format(new Date(activeConversation.contact.createdAt || new Date()))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}