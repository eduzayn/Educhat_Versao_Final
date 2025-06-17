import { db } from '../core/db';
import { eq, count, and } from 'drizzle-orm';
import { teams, userTeams, systemUsers, conversations } from '@shared/schema';
import { TeamCapacity } from './assignmentAnalysisService';

export class TeamCapacityService {
  async analyzeTeamCapacities(): Promise<TeamCapacity[]> {
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        teamType: teams.teamType,
        isActive: teams.isActive,
        priority: teams.priority
      })
      .from(teams)
      .where(eq(teams.isActive, true));
    const capacities: TeamCapacity[] = [];
    for (const team of teamsData) {
      const activeUsers = await db
        .select({ count: count() })
        .from(userTeams)
        .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
        .where(and(eq(userTeams.teamId, team.id), eq(systemUsers.isActive, true)));
      const currentLoad = await db
        .select({ count: count() })
        .from(conversations)
        .where(and(eq(conversations.assignedTeamId, team.id), eq(conversations.status, 'open')));
      const userCount = activeUsers[0]?.count || 0;
      const loadCount = currentLoad[0]?.count || 0;
      const maxCapacity = userCount * 10;
      const utilizationRate = maxCapacity > 0 ? (loadCount / maxCapacity) * 100 : 0;
      capacities.push({
        teamId: team.id,
        teamName: team.name,
        teamType: team.teamType || 'geral',
        activeUsers: userCount,
        currentLoad: loadCount,
        maxCapacity,
        utilizationRate,
        priority: team.priority || 1,
        isActive: team.isActive || false
      });
    }
    return capacities.sort((a, b) => a.utilizationRate - b.utilizationRate);
  }
}

export const teamCapacityService = new TeamCapacityService(); 