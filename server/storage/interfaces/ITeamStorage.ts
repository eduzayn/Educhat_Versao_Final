import { Team, InsertTeam, UserTeam, InsertUserTeam, SystemUser } from '@shared/schema';

export interface ITeamStorage {
  getTeams(): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  getTeamByTeamType(teamType: string): Promise<Team | undefined>;
  getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam>;
  removeUserFromTeam(userId: number, teamId: number): Promise<void>;
  updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<any>;
  getTeamMembers(teamId: number): Promise<any[]>;
  getTeamStatistics(teamId: number): Promise<any>;
  getTeamWorkload(teamId: number): Promise<any>;
  transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any>;
} 