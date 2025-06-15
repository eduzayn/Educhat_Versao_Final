import type { Team, SystemUser } from '@shared/schema';

export interface ConversationAssignmentConfig {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  detectedTeam?: string | null;
  onAssignmentComplete?: (type: 'team' | 'user', id: number | null) => void;
}

export interface TeamSelectorProps {
  conversationId: number;
  currentTeamId?: number | null;
  detectedTeam?: string | null;
  onTeamChange: (teamId: number | null) => void;
  isLoading?: boolean;
}

export interface UserSelectorProps {
  conversationId: number;
  currentUserId?: number | null;
  currentTeamId?: number | null;
  onUserChange: (userId: number | null) => void;
  isLoading?: boolean;
}

export interface AssignmentData {
  teams: Team[];
  users: SystemUser[];
  teamUsers: Record<number, SystemUser[]>;
}

export interface AssignmentMutationData {
  teamId?: number | null;
  userId?: number | null;
  method: 'manual' | 'automatic';
}