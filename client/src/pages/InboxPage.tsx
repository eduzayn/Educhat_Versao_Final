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
  User
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
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <BackButton to="/" label="Dashboard" className="mb-2" />
          
          {/* Status da Conexão Z-API */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-educhat-dark">Conversas</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">WhatsApp:</span>
              <ZApiStatusIndicator />
            </div>
          </div>

          {/* Aviso quando Z-API não está conectada */}
          {!isWhatsAppAvailable && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  WhatsApp desconectado. Configure nas Configurações → Canais de Comunicação
                </span>
              </div>
            </div>
          )}
          
          {/* Abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox">Caixa de Entrada</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  isActive ? 'bg-educhat-purple-50 border-l-4 border-l-educhat-primary' : ''
                }`}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conversation.contact.profileImageUrl || ''} />
                    <AvatarFallback>
                      {conversation.contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.contact.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${channelInfo.color}`}>
                          {channelInfo.icon}
                        </span>
                        {lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(lastMessage.sentAt || new Date())}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage?.content || 'Sem mensagens'}
                      </p>
                      {getStatusBadge(conversation.status)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activeConversation.contact.profileImageUrl || ''} />
                    <AvatarFallback>
                      {activeConversation.contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {activeConversation.contact.name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${getChannelInfo(activeConversation.channel).color}`}>
                        {getChannelInfo(activeConversation.channel).icon} {getChannelInfo(activeConversation.channel).name}
                      </span>
                      {getStatusBadge(activeConversation.status)}
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
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
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-6">
            {/* Informações do Contato */}
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={activeConversation.contact.profileImageUrl || ''} />
                <AvatarFallback className="text-2xl">
                  {activeConversation.contact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {activeConversation.contact.name}
              </h3>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className={getChannelInfo(activeConversation.channel).color}>
                  {getChannelInfo(activeConversation.channel).icon}
                </span>
                <span>{getChannelInfo(activeConversation.channel).name}</span>
              </div>
            </div>

            <Separator />

            {/* Informações de Contato */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Informações de Contato</h4>
              
              {activeConversation.contact.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {activeConversation.contact.phone}
                  </span>
                </div>
              )}
              
              {activeConversation.contact.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {activeConversation.contact.email}
                  </span>
                </div>
              )}
              
              {activeConversation.contact.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {activeConversation.contact.location}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Cliente desde {new Intl.DateTimeFormat('pt-BR', {
                    month: 'long',
                    year: 'numeric'
                  }).format(new Date(activeConversation.contact.createdAt))}
                </span>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Tags</h4>
                <Button variant="ghost" size="sm">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Lead</Badge>
                <Badge variant="secondary" className="text-xs">Ativo</Badge>
              </div>
            </div>

            <Separator />

            {/* Estatísticas da Conversa */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Estatísticas</h4>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <MessageSquare className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-lg font-semibold text-gray-900">
                    {activeConversation.messages?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Mensagens</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-lg font-semibold text-gray-900">2h</div>
                  <div className="text-xs text-gray-600">Tempo médio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}