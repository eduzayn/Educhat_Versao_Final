import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Phone } from "lucide-react";
import { ConversationActionsDropdown } from "../../../../pages/Inbox/components/ConversationActionsDropdown";
import { ConversationAssignmentDropdown } from "../../../../pages/Inbox/components/ConversationAssignmentDropdown";

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
  getChannelInfo,
}: ChatHeaderProps) {
  if (!activeConversation) return null;

  const {
    contact,
    channel,
    id,
    assignedTeamId,
    assignedUserId,
    teamType,
    contactId,
    status,
  } = activeConversation;

  const channelInfo = getChannelInfo(channel);
  const phoneFormatted = contact?.phone
    ? `+${contact.phone.replace(/^\+/, "")}`
    : "";

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Botão "Voltar" (visível apenas no mobile) */}
        {showMobileChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileBackClick}
            className="md:hidden mr-2"
          >
            ← Voltar
          </Button>
        )}

        {/* Informações do contato */}
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={contact?.profileImageUrl || ""} />
            <AvatarFallback className="text-sm">
              {contact?.name?.charAt(0)?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-base">
                {contact?.name || "Contato"}
              </span>
              <span title={channel} className={`text-sm ${channelInfo.color}`}>
                {channelInfo.icon}
              </span>
            </div>
            <span className="text-sm text-gray-500">{phoneFormatted}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <ConversationAssignmentDropdown
            conversationId={id}
            currentTeamId={assignedTeamId}
            currentUserId={assignedUserId}
            detectedTeam={teamType}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Iniciar ligação"
            aria-label="Iniciar ligação"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <ConversationActionsDropdown
            conversationId={id}
            contactId={contactId}
            currentStatus={status || "open"}
          />
        </div>
      </div>
    </header>
  );
}