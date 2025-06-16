import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  contact: {
    name: string;
    avatar?: string;
  };
  channel: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
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
                  conversation.unread ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {conversation.contact.avatar ? (
                    <img
                      src={conversation.contact.avatar}
                      alt={conversation.contact.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-educhat-primary flex items-center justify-center text-white">
                      {conversation.contact.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-educhat-dark truncate">
                      {conversation.contact.name}
                    </p>
                    <span className="text-sm text-educhat-medium">
                      {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
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
        </div>
      </CardContent>
    </Card>
  );
} 