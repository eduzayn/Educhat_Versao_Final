import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Phone, Users } from 'lucide-react';
import { STATUS_CONFIG } from '@/types/chat';
import { ConversationActionsDropdown } from './ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './ConversationAssignmentDropdown';
import { useQuery } from '@tanstack/react-query';

interface ChatHeaderProps {
  activeConversation: any;
  showMobileChat: boolean;
  onMobileBackClick: () => void;
  onStatusChange: (conversationId: number, newStatus: string) => void;
  getChannelInfo: (channel: string) => { icon: string; color: string };
}

export function ChatHeader({
  activeConversation,
  showMobileChat,
  onMobileBackClick,
  onStatusChange,
  getChannelInfo
}: ChatHeaderProps) {
  if (!activeConversation) return null;

  // Buscar usuários da equipe responsável pela conversa
  const { data: teamUsers = [] } = useQuery({
    queryKey: ['team-users', activeConversation.assignedTeamId],
    queryFn: async () => {
      if (!activeConversation.assignedTeamId) return [];
      const response = await fetch(`/api/internal-chat/channels/team-${activeConversation.assignedTeamId}/users`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activeConversation.assignedTeamId
  });

  const onlineCount = teamUsers.filter((user: any) => user.isOnline).length;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 mobile-sticky mobile-p-reduced">
      <div className="flex items-center justify-between">
        {/* Mobile back button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileBackClick}
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                {activeConversation.contact.phone && `+${activeConversation.contact.phone.replace(/^\+/, '')}`}
              </p>
              {activeConversation.assignedTeamId && onlineCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>{onlineCount} online</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Componentes de Atribuição */}
          <ConversationAssignmentDropdown
            conversationId={activeConversation.id}
            currentTeamId={activeConversation.assignedTeamId}
            currentUserId={activeConversation.assignedUserId}
            detectedTeam={activeConversation.teamType}
          />
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
    </div>
  );
}