import { BaseStorage } from '../base/BaseStorage';
import { userTeams, teams, systemUsers, type UserTeam, type InsertUserTeam, type SystemUser } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class TeamMemberOperations extends BaseStorage {
  async getUserTeams(userId: number): Promise<any[]> {
    const result = await this.db
      .select({
        team: teams
      })
      .from(userTeams)
      .innerJoin(teams, eq(userTeams.teamId, teams.id))
      .where(eq(userTeams.userId, userId));

    return result.map(r => r.team);
  }

  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    const [newUserTeam] = await this.db.insert(userTeams).values(userTeam).returning();
    return newUserTeam;
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await this.db
      .delete(userTeams)
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ));
  }

  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<UserTeam> {
    const [updatedUserTeam] = await this.db
      .update(userTeams)
      .set({ role })
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ))
      .returning();
    return updatedUserTeam;
  }

  async getTeamMembers(teamId: number): Promise<SystemUser[]> {
    const result = await this.db
      .select({
        user: systemUsers
      })
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(eq(userTeams.teamId, teamId));

    return result.map(r => r.user);
  }
} 