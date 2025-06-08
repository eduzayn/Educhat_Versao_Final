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
 */
export class TeamStorage extends BaseStorage {
  async getTeams(): Promise<Team[]> {
    try {
      return await this.getAllTeams();
    } catch (error) {
      this.handleError(error, 'getTeams');
    }
  }

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

  async deleteTeam(id: number): Promise<void> {
    try {
      await this.db
        .delete(teams)
        .where(this.eq(teams.id, id));
    } catch (error) {
      this.handleError(error, 'deleteTeam');
    }
  }

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

  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    try {
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
      
      if (teamUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * teamUsers.length);
        return teamUsers[randomIndex].system_users;
      }
      
      return undefined;
    } catch (error) {
      this.handleError(error, 'getAvailableUserFromTeam');
    }
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    try {
      const userTeamsData = await this.db
        .select({ team: teams })
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