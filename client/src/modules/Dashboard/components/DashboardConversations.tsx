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
      <CardContent>
        <div className="space-y-4">
          {(Array.isArray(conversations) ? conversations : []).map((conversation) => {
            const ChannelIcon = getChannelIcon(conversation.channel);
            return (
              <div
                key={conversation.id}
                className={`flex items-start space-x-3 p-3 rounded-lg ${
                  conversation.unreadCount > 0 ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-educhat-primary flex items-center justify-center text-white">
                    {conversation.contactName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-educhat-dark truncate">
                      {conversation.contactName}
                    </p>
                    <span className="text-sm text-educhat-medium">
                      {conversation.lastActivity ? formatDistanceToNow(new Date(conversation.lastActivity), {
                        addSuffix: true,
                        locale: ptBR,
                      }) : 'Agora'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <ChannelIcon className="w-4 h-4 text-educhat-medium" />
                      <p className="text-sm text-educhat-medium truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 