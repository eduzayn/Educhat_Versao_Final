import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: number;
  contactId: number;
  contactName: string;
  phone: string;
  channel: string;
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
}

interface DashboardConversationsProps {
  conversations: Conversation[];
  onViewAll: () => void;
}

export function DashboardConversations({ conversations, onViewAll }: DashboardConversationsProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return Phone;
      case 'email':
        return Mail;
      default:
        return MessageCircle;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-educhat-dark">Conversas Recentes</CardTitle>
        <Button variant="ghost" onClick={onViewAll}>
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {(Array.isArray(conversations) ? conversations : []).map((conversation) => {
            const ChannelIcon = getChannelIcon(conversation.channel);
            return (
              <div
                key={conversation.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                  conversation.unreadCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-educhat-primary flex items-center justify-center text-white font-medium">
                    {conversation.contactName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-educhat-dark truncate">
                      {conversation.contactName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-educhat-medium whitespace-nowrap">
                        {conversation.lastActivity ? formatDistanceToNow(new Date(conversation.lastActivity), {
                          addSuffix: true,
                          locale: ptBR,
                        }) : 'Agora'}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChannelIcon className="w-4 h-4 text-educhat-medium" />
                    <p className="text-sm text-educhat-medium truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {(!conversations || conversations.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa recente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}