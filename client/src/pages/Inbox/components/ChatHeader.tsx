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
            <div className="flex items-center space-x-2 mt-0.5">
              <Select 
                value={activeConversation.status || 'open'} 
                onValueChange={(newStatus) => onStatusChange(activeConversation.id, newStatus)}
              >
                <SelectTrigger className="h-6 w-auto border-0 p-1 text-xs bg-transparent">
                  <SelectValue>
                    <Badge 
                      variant="secondary" 
                      className={`${STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.bgColor} ${STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.color} text-xs`}
                    >
                      {STATUS_CONFIG[activeConversation.status as keyof typeof STATUS_CONFIG]?.label || activeConversation.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Ativa
                    </Badge>
                  </SelectItem>
                  <SelectItem value="pending">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                      Aguardando
                    </Badge>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      Em Andamento
                    </Badge>
                  </SelectItem>
                  <SelectItem value="resolved">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Resolvida
                    </Badge>
                  </SelectItem>
                  <SelectItem value="closed">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                      Encerrada
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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