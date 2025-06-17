import { BaseStorage } from '../base/BaseStorage';
import { teams, type Team, type InsertTeam } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class TeamBasicOperations extends BaseStorage {
  async getTeams(): Promise<Team[]> {
    return this.db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await this.db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await this.db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    await this.db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamByTeamType(teamType: string): Promise<Team | undefined> {
    const [team] = await this.db.select()
      .from(teams)
      .where(and(
        eq(teams.teamType, teamType),
        eq(teams.isActive, true)
      ));
    return team;
  }
} 