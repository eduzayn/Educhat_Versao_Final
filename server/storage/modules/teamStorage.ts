import { BaseStorage } from "../base/BaseStorage";
import { teams, userTeams, systemUsers, type Team, type InsertTeam, type UserTeam, type InsertUserTeam, type SystemUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { TeamBasicOperations } from './teamBasicOperations';
import { TeamMemberOperations } from './teamMemberOperations';
import { TeamDetectionOperations } from './teamDetectionOperations';
import { TeamStatisticsOperations } from './teamStatisticsOperations';

/**
 * Team storage module - manages team operations
 */
export class TeamStorage extends BaseStorage {
  private basicOps: TeamBasicOperations;
  private memberOps: TeamMemberOperations;
  private detectionOps: TeamDetectionOperations;
  private statsOps: TeamStatisticsOperations;

  constructor() {
    super();
    this.basicOps = new TeamBasicOperations();
    this.memberOps = new TeamMemberOperations();
    this.detectionOps = new TeamDetectionOperations();
    this.statsOps = new TeamStatisticsOperations();
  }

  /**
   * Get all teams
   */
  async getTeams(): Promise<Team[]> {
    return this.basicOps.getTeams();
  }

  /**
   * Get team by ID
   */
  async getTeam(id: number): Promise<Team | undefined> {
    return this.basicOps.getTeam(id);
  }

  /**
   * Create new team
   */
  async createTeam(team: InsertTeam): Promise<Team> {
    return this.basicOps.createTeam(team);
  }

  /**
   * Update team
   */
  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    return this.basicOps.updateTeam(id, team);
  }

  /**
   * Delete team
   */
  async deleteTeam(id: number): Promise<void> {
    return this.basicOps.deleteTeam(id);
  }

  /**
   * Get team by team type (unified method)
   */
  async getTeamByTeamType(teamType: string): Promise<Team | undefined> {
    return this.basicOps.getTeamByTeamType(teamType);
  }

  /**
   * Get available user from team
   */
  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    return this.detectionOps.getAvailableUserFromTeam(teamId);
  }

  /**
   * Test team detection for automatic assignment
   */
  async testTeamDetection(messageContent: string): Promise<{ teamType: string; confidence: number } | null> {
    return this.detectionOps.testTeamDetection(messageContent);
  }

  /**
   * Get user teams
   */
  async getUserTeams(userId: number): Promise<Team[]> {
    return this.memberOps.getUserTeams(userId);
  }

  /**
   * Add user to team
   */
  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    return this.memberOps.addUserToTeam(userTeam);
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    return this.memberOps.removeUserFromTeam(userId, teamId);
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<UserTeam> {
    return this.memberOps.updateTeamMemberRole(userId, teamId, role);
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: number): Promise<SystemUser[]> {
    return this.memberOps.getTeamMembers(teamId);
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(teamId: number): Promise<any> {
    return this.statsOps.getTeamStatistics(teamId);
  }
}