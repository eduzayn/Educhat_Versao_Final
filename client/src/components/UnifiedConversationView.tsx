import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { MessageSquare, Phone, Mail, Instagram, Facebook } from 'lucide-react';

interface ConversationWithContact {
  id: number;
  contactId: number;
  channel: string;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  contact: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    sentAt: string;
    isFromContact: boolean;
    messageType: string;
  };
}

interface UnifiedConversationViewProps {
  contactId: number;
  onConversationSelect: (conversationId: number) => void;
}

const channelConfig = {
  whatsapp: { 
    label: 'WhatsApp', 
    color: 'bg-green-500', 
    icon: MessageSquare,
    textColor: 'text-green-600'
  },
  'whatsapp-1': { 
    label: 'WhatsApp Comercial', 
    color: 'bg-green-600', 
    icon: MessageSquare,
    textColor: 'text-green-700'
  },
  instagram: { 
    label: 'Instagram', 
    color: 'bg-pink-500', 
    icon: Instagram,
    textColor: 'text-pink-600'
  },
  facebook: { 
    label: 'Facebook', 
    color: 'bg-blue-500', 
    icon: Facebook,
    textColor: 'text-blue-600'
  },
  email: { 
    label: 'E-mail', 
    color: 'bg-gray-500', 
    icon: Mail,
    textColor: 'text-gray-600'
  },
  sms: { 
    label: 'SMS', 
    color: 'bg-orange-500', 
    icon: Phone,
    textColor: 'text-orange-600'
  }
};

export function UnifiedConversationView({ contactId, onConversationSelect }: UnifiedConversationViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  const { data: conversations = [], isLoading } = useQuery<ConversationWithContact[]>({
    queryKey: ['/api/contacts', contactId, 'conversations'],
    enabled: !!contactId,
  });

  const channels = Array.from(new Set(conversations.map(conv => conv.channel)));
  const filteredConversations = selectedChannel === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.channel === selectedChannel);

  const formatLastMessage = (message?: ConversationWithContact['lastMessage']) => {
    if (!message) return 'Sem mensagens';
    
    const prefix = message.isFromContact ? '' : 'Você: ';
    const content = message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
    
    return `${prefix}${content}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>Nenhuma conversa encontrada para este contato</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Conversas com {conversations[0]?.contact?.name}
        </h3>
        <Badge variant="secondary">
          {conversations.length} canal{conversations.length !== 1 ? 'is' : ''}
        </Badge>
      </div>

      <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
        <TabsList className="grid w-full grid-cols-auto">
          <TabsTrigger value="all">
            Todos ({conversations.length})
          </TabsTrigger>
          {channels.map(channel => {
            const config = channelConfig[channel as keyof typeof channelConfig];
            const Icon = config?.icon || MessageSquare;
            const channelConversations = conversations.filter((conv: ConversationWithContact) => conv.channel === channel);
            
            return (
              <TabsTrigger key={channel} value={channel} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config?.label || channel}
                <Badge variant="secondary" className="ml-1">
                  {channelConversations.length}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedChannel} className="space-y-2">
          {filteredConversations.map((conversation: ConversationWithContact) => {
            const config = channelConfig[conversation.channel as keyof typeof channelConfig];
            const Icon = config?.icon || MessageSquare;
            
            return (
              <Card 
                key={conversation.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onConversationSelect(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config?.textColor || 'text-gray-600'}`} />
                        <Badge 
                          variant="secondary" 
                          className={`${config?.color || 'bg-gray-500'} text-white`}
                        >
                          {config?.label || conversation.channel}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Conversa #{conversation.id}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {formatLastMessage(conversation.lastMessage)}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={conversation.status === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.status === 'open' ? 'Aberta' : 
                             conversation.status === 'pending' ? 'Pendente' : 'Resolvida'}
                          </Badge>
                          
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount} não lida{conversation.unreadCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}