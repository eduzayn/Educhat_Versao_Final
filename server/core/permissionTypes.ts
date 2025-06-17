import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    displayName: string;
    role: string;
    roleId: number;
    dataKey?: string;
    channels: string[];
    teams: string[];
    teamTypes: string[];
    teamId?: number | null;
    team?: string | null;
  } | undefined;
}

export interface PermissionContext {
  resourceId?: string;
  channelId?: number;
  teamId?: number;
  dataKey?: string;
}

export interface AuditLogData {
  userId: number;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  result: 'success' | 'failure';
} 