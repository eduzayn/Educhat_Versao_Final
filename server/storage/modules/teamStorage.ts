import { BaseStorage } from "../base/BaseStorage";
import { teams, systemUsers, userTeams, type Team, type InsertTeam, type SystemUser, type UserTeam, type InsertUserTeam } from "../../../shared/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Team storage module - manages teams and user assignments
 */
export class TeamStorage extends BaseStorage {
  async getTeams(): Promise<Team[]> {
    return this.db.select().from(teams).orderBy(desc(teams.createdAt));
  }

  async getAllTeams(): Promise<Team[]> {
    return this.getTeams();
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await this.db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team> {
    const [updated] = await this.db.update(teams)
      .set({ ...teamData, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  async deleteTeam(id: number): Promise<void> {
    // First remove all user assignments
    await this.db.delete(userTeams).where(eq(userTeams.teamId, id));
    
    // Then delete the team
    await this.db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams)
      .where(and(
        eq(teams.macrosetor, macrosetor),
        eq(teams.isActive, true)
      ));
    return team;
  }

  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    // Get the first available user from the team
    const [userTeam] = await this.db
      .select({
        user: systemUsers
      })
      .from(userTeams)
      .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(and(
        eq(userTeams.teamId, teamId),
        eq(userTeams.isActive, true),
        eq(systemUsers.isActive, true),
        eq(systemUsers.isOnline, true)
      ))
      .limit(1);

    return userTeam?.user;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await this.db
      .select({
        team: teams
      })
      .from(userTeams)
      .leftJoin(teams, eq(userTeams.teamId, teams.id))
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.isActive, true)
      ));

    return result.map(r => r.team).filter(Boolean) as Team[];
  }

  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    // Check if user is already in the team
    const [existing] = await this.db.select().from(userTeams)
      .where(and(
        eq(userTeams.userId, userTeam.userId),
        eq(userTeams.teamId, userTeam.teamId)
      ));

    if (existing) {
      // Reactivate if exists but inactive
      const [updated] = await this.db.update(userTeams)
        .set({ 
          isActive: true, 
          role: userTeam.role || existing.role,
          joinedAt: new Date()
        })
        .where(eq(userTeams.id, existing.id))
        .returning();
      return updated;
    }

    const [newUserTeam] = await this.db.insert(userTeams).values(userTeam).returning();
    return newUserTeam;
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await this.db.update(userTeams)
      .set({ isActive: false })
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ));
  }

  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<UserTeam> {
    const [updated] = await this.db.update(userTeams)
      .set({ role })
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ))
      .returning();
    return updated;
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    const result = await this.db
      .select({
        id: userTeams.id,
        role: userTeams.role,
        isActive: userTeams.isActive,
        joinedAt: userTeams.joinedAt,
        user: {
          id: systemUsers.id,
          username: systemUsers.username,
          displayName: systemUsers.displayName,
          email: systemUsers.email,
          isOnline: systemUsers.isOnline,
          lastLoginAt: systemUsers.lastLoginAt
        }
      })
      .from(userTeams)
      .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(eq(userTeams.teamId, teamId))
      .orderBy(desc(userTeams.joinedAt));

    return result;
  }

  async getTeamStatistics(teamId: number): Promise<any> {
    // Basic team statistics - can be expanded
    const [stats] = await this.db
      .select({
        totalMembers: systemUsers.id,
        activeMembers: systemUsers.isActive,
        onlineMembers: systemUsers.isOnline
      })
      .from(userTeams)
      .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(eq(userTeams.teamId, teamId));

    return {
      teamId,
      totalMembers: 0, // Would need proper aggregation
      activeMembers: 0,
      onlineMembers: 0,
      // Add more statistics as needed
    };
  }

  async getTeamWorkload(teamId: number): Promise<any> {
    // Team workload analysis - placeholder implementation
    return {
      teamId,
      activeConversations: 0,
      pendingTasks: 0,
      averageResponseTime: 0,
      // Add more workload metrics
    };
  }

  async transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any> {
    // This would integrate with conversation storage
    // Placeholder implementation
    return {
      conversationId,
      fromTeamId,
      toTeamId,
      transferredAt: new Date(),
      success: true
    };
  }
}