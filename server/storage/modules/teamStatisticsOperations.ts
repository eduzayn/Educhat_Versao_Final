import { BaseStorage } from '../base/BaseStorage';
import { teams, userTeams, systemUsers } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class TeamStatisticsOperations extends BaseStorage {
  async getTeamStatistics(teamId: number): Promise<any> {
    // Implementar estatísticas específicas do time
    const members = await this.getTeamMembers(teamId);
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isOnline).length,
      teamId
    };
  }

  // Busca membros do time (usado internamente)
  private async getTeamMembers(teamId: number) {
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