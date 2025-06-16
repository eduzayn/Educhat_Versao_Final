import { useState } from 'react';
import { TeamSelector } from '@/modules/Inbox/components/ConversationAssignment/components/TeamSelector';
import { UserSelector } from '@/modules/Inbox/components/ConversationAssignment/components/UserSelector';
import type { ConversationAssignmentConfig } from './types';

export function ConversationAssignment({
  conversationId,
  currentTeamId,
  currentUserId,
  detectedTeam,
  onAssignmentComplete,
}: ConversationAssignmentConfig) {
  const [localTeamId, setLocalTeamId] = useState(currentTeamId);
  const [localUserId, setLocalUserId] = useState(currentUserId);

  const handleTeamChange = (teamId: number | null) => {
    setLocalTeamId(teamId);
    // Reset user assignment when team changes
    if (teamId !== currentTeamId) {
      setLocalUserId(null);
    }
    onAssignmentComplete?.('team', teamId);
  };

  const handleUserChange = (userId: number | null) => {
    setLocalUserId(userId);
    onAssignmentComplete?.('user', userId);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <TeamSelector
        conversationId={conversationId}
        currentTeamId={localTeamId}
        detectedTeam={detectedTeam}
        onTeamChange={handleTeamChange}
      />
      
      <UserSelector
        conversationId={conversationId}
        currentUserId={localUserId}
        currentTeamId={localTeamId}
        onUserChange={handleUserChange}
      />
    </div>
  );
}