import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Phone, 
  Mail,
  MoreHorizontal 
} from 'lucide-react';

interface ConversationItem {
  id: number;
  contactName: string;
  lastMessage: string;
  unreadCount: number;
  status: string;
  channel: string;
  assignedTeamId: number;
  assignedUserId?: number;
  assignedUserName?: string;
  lastMessageAt: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface TeamTransferCardProps {
  conversation: ConversationItem;
  provided: any;
  snapshot: any;
}

export function TeamTransferCard({ conversation, provided, snapshot }: TeamTransferCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '📱';
      case 'instagram': return '📷';
      case 'facebook': return '💬';
      case 'email': return '✉️';
      default: return '💬';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`p-3 cursor-grab hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 ${
        snapshot.isDragging ? 'shadow-lg rotate-2 bg-blue-50 dark:bg-blue-950 scale-105' : 'hover:scale-[1.02]'
      }`}
    >
      <div className="space-y-2">
        {/* Header simplificado com nome e badges */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {conversation.contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {conversation.contactName}
              </h4>
              {conversation.contactPhone && (
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.contactPhone}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {conversation.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {conversation.unreadCount}
              </Badge>
            )}
            <span className="text-lg">{getChannelIcon(conversation.channel)}</span>
          </div>
        </div>

        {/* Footer compacto */}
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(conversation.status)} text-xs px-2 py-0.5`}>
            {conversation.status === 'open' ? 'Aberta' : 
             conversation.status === 'pending' ? 'Pendente' : 
             conversation.status === 'closed' ? 'Fechada' : conversation.status}
          </Badge>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(conversation.lastMessageAt)}
          </div>
        </div>
      </div>
    </Card>
  );
}