import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Phone } from 'lucide-react';
import { STATUS_CONFIG } from '@/types/chat';
import { ConversationActionsDropdown } from './ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './ConversationAssignmentDropdown';

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
            <p className="text-sm text-gray-500">
              {activeConversation.contact.phone && `+${activeConversation.contact.phone.replace(/^\+/, '')}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Componentes de Atribuição */}
          <ConversationAssignmentDropdown
            conversationId={activeConversation.id}
            currentTeamId={activeConversation.assignedTeamId}
            currentUserId={activeConversation.assignedUserId}
            currentMacrosetor={activeConversation.macrosetor}
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