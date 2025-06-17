import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { ContactAvatar } from "@/shared/ui/ContactAvatar";
import { Clock, Phone, Video, StickyNote } from "lucide-react";
import { ConversationActionsDropdown } from "@/modules/Inbox/components/ConversationActions";
import { ConversationAssignment } from "@/modules/Inbox/components/ConversationAssignment";
import { InternalNotesPanel } from "@/modules/Messages/components/InternalNotes/InternalNotesPanel";
import { useState } from "react";

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
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  
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
          <ContactAvatar
            src={contact?.profileImageUrl}
            name={contact?.name}
            contactId={contactId}
            size="sm"
            className="w-9 h-9"
          />

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
          <ConversationAssignment
            conversationId={id}
            currentTeamId={assignedTeamId}
            currentUserId={assignedUserId}
            detectedTeam={teamType}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Notas Internas"
            aria-label="Notas Internas"
            onClick={() => setShowInternalNotes(true)}
          >
            <StickyNote className="w-4 h-4" />
          </Button>
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
      
      {/* Panel de Notas Internas */}
      <InternalNotesPanel
        conversationId={id}
        isOpen={showInternalNotes}
        onClose={() => setShowInternalNotes(false)}
      />
    </header>
  );
}