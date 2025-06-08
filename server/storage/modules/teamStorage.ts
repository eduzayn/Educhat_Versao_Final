import { BaseStorage } from "../base/BaseStorage";
import {
  teams,
  userTeams,
  roles,
  systemUsers,
  type Team,
  type InsertTeam,
  type UserTeam,
  type InsertUserTeam,
  type Role,
  type InsertRole,
  type SystemUser,
} from "@shared/schema";

/**
 * Team storage module
 * Handles team operations, user assignments, and role management
 */
export class TeamStorage extends BaseStorage {
  // Team operations
  
  /**
   * Get all teams
   */
  async getTeams(): Promise<Team[]> {
    try {
      return await this.getAllTeams();
    } catch (error) {
      this.handleError(error, 'getTeams');
    }
  }

  /**
   * Get all teams (alias for compatibility)
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      return await this.db
        .select()
        .from(teams)
        .orderBy(this.desc(teams.createdAt));
    } catch (error) {
      this.handleError(error, 'getAllTeams');
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(id: number): Promise<Team | undefined> {
    try {
      const [team] = await this.db
        .select()
        .from(teams)
        .where(this.eq(teams.id, id));
      return team;
    } catch (error) {
      this.handleError(error, 'getTeam');
    }
  }

  /**
   * Create new team
   */
  async createTeam(team: InsertTeam): Promise<Team> {
    try {
      this.validateRequired(team, ['name'], 'createTeam');
      
      const [newTeam] = await this.db
        .insert(teams)
        .values(team)
        .returning();
      return newTeam;
    } catch (error) {
      this.handleError(error, 'createTeam');
    }
  }

  /**
   * Update team
   */
  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    try {
      const [updatedTeam] = await this.db
        .update(teams)
        .set({ ...team, updatedAt: new Date() })
        .where(this.eq(teams.id, id))
        .returning();
      return updatedTeam;
    } catch (error) {
      this.handleError(error, 'updateTeam');
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(id: number): Promise<void> {
    try {
      await this.db
        .delete(teams)
        .where(this.eq(teams.id, id));
    } catch (error) {
      this.handleError(error, 'deleteTeam');
    }
  }

  /**
   * Get team by macrosetor
   */
  async getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined> {
    try {
      const [team] = await this.db
        .select()
        .from(teams)
        .where(this.eq(teams.macrosetor, macrosetor));
      return team;
    } catch (error) {
      this.handleError(error, 'getTeamByMacrosetor');
    }
  }

  /**
   * Get available user from team (for auto-assignment)
   */
  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    try {
      // Get users from team who are active
      const teamUsers = await this.db
        .select()
        .from(systemUsers)
        .innerJoin(userTeams, this.eq(userTeams.userId, systemUsers.id))
        .where(
          this.and(
            this.eq(userTeams.teamId, teamId),
            this.eq(systemUsers.isActive, true)
          )
        );
      
      // Simple round-robin selection (can be enhanced with workload balancing)
      if (teamUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * teamUsers.length);
        return teamUsers[randomIndex].system_users;
      }
      
      return undefined;
    } catch (error) {
      this.handleError(error, 'getAvailableUserFromTeam');
    }
  }

  // UserTeam operations
  
  /**
   * Get teams for a user
   */
  async getUserTeams(userId: number): Promise<Team[]> {
    try {
      const userTeamsData = await this.db
        .select({
          team: teams
        })
        .from(userTeams)
        .leftJoin(teams, this.eq(userTeams.teamId, teams.id))
        .where(this.eq(userTeams.userId, userId));
      
      return userTeamsData
        .filter(row => row.team)
        .map(row => row.team!);
    } catch (error) {
      this.handleError(error, 'getUserTeams');
    }
  }

  /**
   * Add user to team
   */
  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    try {
      this.validateRequired(userTeam, ['userId', 'teamId'], 'addUserToTeam');
      
      const [newUserTeam] = await this.db
        .insert(userTeams)
        .values(userTeam)
        .returning();
      return newUserTeam;
    } catch (error) {
      this.handleError(error, 'addUserToTeam');
    }
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    try {
      await this.db
        .delete(userTeams)
        .where(
          this.and(
            this.eq(userTeams.userId, userId),
            this.eq(userTeams.teamId, teamId)
          )
        );
    } catch (error) {
      this.handleError(error, 'removeUserFromTeam');
    }
  }

  // Role operations
  
  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      return await this.db
        .select()
        .from(roles)
        .orderBy(roles.name);
    } catch (error) {
      this.handleError(error, 'getRoles');
    }
  }

  /**
   * Get role by ID
   */
  async getRole(id: number): Promise<Role | undefined> {
    try {
      const [role] = await this.db
        .select()
        .from(roles)
        .where(this.eq(roles.id, id));
      return role;
    } catch (error) {
      this.handleError(error, 'getRole');
    }
  }

  /**
   * Create new role
   */
  async createRole(roleData: InsertRole): Promise<Role> {
    try {
      this.validateRequired(roleData, ['name'], 'createRole');
      
      const [role] = await this.db
        .insert(roles)
        .values(roleData)
        .returning();
      return role;
    } catch (error) {
      this.handleError(error, 'createRole');
    }
  }

  /**
   * Update role
   */
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    try {
      const [role] = await this.db
        .update(roles)
        .set({ ...roleData, updatedAt: new Date() })
        .where(this.eq(roles.id, id))
        .returning();
      return role;
    } catch (error) {
      this.handleError(error, 'updateRole');
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<void> {
    try {
      await this.db
        .delete(roles)
        .where(this.eq(roles.id, id));
    } catch (error) {
      this.handleError(error, 'deleteRole');
    }
  }
}