import { systemUsers, teams, userTeams, roles } from '../../../../shared/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SystemUser = InferSelectModel<typeof systemUsers>;
export type Team = InferSelectModel<typeof teams>;
export type UserTeam = InferSelectModel<typeof userTeams>;
export type Role = InferSelectModel<typeof roles>;

export interface UserPermissions {
  canViewAll: boolean;
  canViewTeams: boolean;
  canViewPrivate: boolean;
  isAdmin: boolean;
  isManager: boolean;
  user: SystemUser & { roleName: string | null };
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'team';
  teamId?: number;
  isPrivate: boolean;
  participants: any[];
  unreadCount: number;
}

export interface Message {
  id: string;
  channelId: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  messageType: string;
  timestamp: Date;
  reactions: Record<string, any>;
} 