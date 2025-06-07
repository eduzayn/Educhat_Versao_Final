import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Search, Filter, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { ConversationActionsDropdown } from './ConversationActionsDropdown';
// import { CreateContactDialog } from './CreateContactDialog';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationSidebarProps {
  conversations: ConversationWithContact[];
  activeConversation: ConversationWithContact | null;
  onSelectConversation: (conversation: ConversationWithContact) => void;
  isLoading: boolean;
  channels: any[];
  showMobileChat: boolean;
}

export function ConversationSidebar({ 
  conversations, 
  activeConversation, 
  onSelectConversation, 
  isLoading,
  channels,
  showMobileChat 
}: ConversationSidebarProps) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para filtrar conversas
  const filteredConversations = conversations.filter(conversation => {
    // Filtro por aba
    if (activeTab === 'inbox' && conversation.status === 'resolved') return false;
    if (activeTab === 'resolved' && conversation.status !== 'resolved') return false;
    
    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = conversation.contact?.name?.toLowerCase().includes(searchLower);
      const phoneMatch = conversation.contact?.phone?.includes(searchTerm);
      const lastMessageMatch = conversation.messages?.[0]?.content?.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !phoneMatch && !lastMessageMatch) return false;
    }
    
    // Filtro por status
    if (statusFilter !== 'all' && conversation.status !== statusFilter) return false;
    
    // Filtro por canal
    if (channelFilter !== 'all') {
      if (channelFilter.startsWith('whatsapp-')) {
        const channelId = channelFilter.replace('whatsapp-', '');
        if (conversation.channelId?.toString() !== channelId) return false;
      } else if (conversation.channel !== channelFilter) {
        return false;
      }
    }
    
    return true;
  });

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '📱';
      case 'instagram': return '📷';
      case 'facebook': return '👥';
      case 'email': return '📧';
      default: return '💬';
    }
  };

  return (
    <div className={`w-80 md:w-80 ${showMobileChat ? 'mobile-hide' : 'mobile-full-width'} bg-white border-r border-gray-200 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-educhat-dark">Conversas</h1>
          <div className="flex items-center gap-2">
            <ZApiStatusIndicator />
            <CreateContactDialog 
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              trigger={
                <Button 
                  size="sm" 
                  variant="outline"
                  title="Novo contato"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              }
            />
          </div>
        </div>
        
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
        
        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="inbox" className="text-xs">Entrada</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolvidas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filtros */}
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
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando conversas...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation, index) => {
              const lastMessage = conversation.messages?.[0];
              const isActive = activeConversation?.id === conversation.id;
              const unreadCount = conversation.unreadCount || 0;
              
              return (
                <div
                  key={`conversation-${conversation.id}-${index}`}
                  className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation)}
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
                            <>
                              {!lastMessage.isFromContact && 'Você: '}
                              {lastMessage.content}
                            </>
                          ) : (
                            'Nenhuma mensagem'
                          )}
                        </p>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs">
                            {getChannelIcon(conversation.channel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}