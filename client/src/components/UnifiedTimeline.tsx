import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Separator } from '@/shared/ui/ui/separator';
import { MessageSquare, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sentAt: string;
  isFromContact: boolean;
  messageType: string;
  conversationId: number;
  channel: string;
  whatsappMessageId?: string;
  zapiStatus?: string;
}

interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  profileImageUrl?: string;
}

interface UnifiedTimelineProps {
  contactId: number;
  contact: Contact;
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

export function UnifiedTimeline({ contactId, contact }: UnifiedTimelineProps) {
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['/api/contacts', contactId, 'conversations'],
    enabled: !!contactId,
  });

  // Buscar mensagens de todas as conversas do contato
  const conversationIds = conversations.map((conv: any) => conv.id);
  
  const { data: allMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/messages/unified', contactId],
    queryFn: async () => {
      if (!conversationIds.length) return [];
      
      // Buscar mensagens de todas as conversas
      const messagePromises = conversationIds.map(async (convId: number) => {
        const response = await fetch(`/api/conversations/${convId}/messages?limit=50`);
        const messages = await response.json();
        
        // Encontrar o canal da conversa
        const conversation = conversations.find((c: any) => c.id === convId);
        
        return messages.map((msg: any) => ({
          ...msg,
          conversationId: convId,
          channel: conversation?.channel || 'unknown'
        }));
      });
      
      const messageArrays = await Promise.all(messagePromises);
      const flatMessages = messageArrays.flat();
      
      // Ordenar por data
      return flatMessages.sort((a: Message, b: Message) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    },
    enabled: !!contactId && conversationIds.length > 0,
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) { // 7 dias
      return date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = new Date(message.sentAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
  };

  if (loadingConversations || loadingMessages) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!allMessages.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <h3 className="text-lg font-medium mb-1">Timeline vazia</h3>
        <p>Nenhuma mensagem encontrada para este contato</p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(allMessages);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={contact.profileImageUrl} />
          <AvatarFallback>
            {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{contact.name}</h2>
          <p className="text-sm text-gray-500">Timeline completa de conversas</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {allMessages.length} mensagens em {conversations.length} canal{conversations.length !== 1 ? 'is' : ''}
        </Badge>
      </div>

      <div className="space-y-6">
        {messageGroups.map(({ date, messages }) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center space-x-3">
              <Separator className="flex-1" />
              <Badge variant="outline" className="text-xs px-3 py-1">
                {formatDate(messages[0].sentAt)}
              </Badge>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              {messages.map((message) => {
                const config = channelConfig[message.channel as keyof typeof channelConfig];
                const Icon = config?.icon || MessageSquare;
                const isFromContact = message.isFromContact;

                return (
                  <Card 
                    key={message.id} 
                    className={`${isFromContact ? 'mr-12' : 'ml-12'} transition-colors hover:bg-gray-50`}
                  >
                    <CardContent className="p-4">
                      <div className={`flex items-start space-x-3 ${!isFromContact ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          {isFromContact ? (
                            <>
                              <AvatarImage src={contact.profileImageUrl} />
                              <AvatarFallback className="text-xs">
                                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              EU
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className={`flex-1 ${!isFromContact ? 'text-right' : ''}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="flex items-center space-x-1">
                              <Icon className={`h-3 w-3 ${config?.textColor || 'text-gray-600'}`} />
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${config?.color || 'bg-gray-500'} text-white`}
                              >
                                {config?.label || message.channel}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.sentAt)}
                            </span>
                            {message.zapiStatus && (
                              <Badge variant="outline" className="text-xs">
                                {message.zapiStatus}
                              </Badge>
                            )}
                          </div>

                          <div className={`rounded-lg p-3 max-w-xs ${
                            isFromContact 
                              ? 'bg-gray-100 text-gray-900' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            
                            {message.messageType !== 'text' && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {message.messageType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}