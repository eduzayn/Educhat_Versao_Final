import { BaseStorage } from "../base/BaseStorage";
import { teams, userTeams, systemUsers, teamTransferHistory, conversations, contacts, type Team, type InsertTeam, type UserTeam, type InsertUserTeam, type SystemUser, type InsertTeamTransferHistory } from "../../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Team storage module - manages team operations
 */
export class TeamStorage extends BaseStorage {
  /**
   * Get all teams
   */
  async getTeams(): Promise<Team[]> {
    return this.db.select().from(teams);
  }

  /**
   * Get team by ID
   */
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  /**
   * Create new team
   */
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await this.db.insert(teams).values(team).returning();
    return newTeam;
  }

  /**
   * Update team
   */
  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await this.db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  /**
   * Delete team
   */
  async deleteTeam(id: number): Promise<void> {
    await this.db.delete(teams).where(eq(teams.id, id));
  }

  /**
   * Get team by type (unified method)
   */
  async getTeamByType(teamType: string): Promise<Team | undefined> {
    // Mapeamento de tipos de equipe para nomes de equipes
    const teamTypeToTeamName = {
      'comercial': 'Equipe Comercial',
      'suporte': 'Equipe Suporte',
      'cobranca': 'Equipe Cobrança',
      'tutoria': 'Equipe Tutoria',
      'secretaria': 'Equipe Secretaria',
      'geral': 'Equipe Geral'
    };
    
    const teamName = teamTypeToTeamName[teamType as keyof typeof teamTypeToTeamName] || 'Equipe Geral';
    
    const [team] = await this.db.select()
      .from(teams)
      .where(and(
        eq(teams.name, teamName),
        eq(teams.isActive, true)
      ));
    return team;
  }
  }

  /**
   * Get available user from team
   */
  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    const userTeam = await this.db
      .select({
        user: systemUsers
      })
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(and(
        eq(userTeams.teamId, teamId),
        eq(systemUsers.isOnline, true)
      ))
      .limit(1);

    return userTeam[0]?.user || undefined;
  }

  /**
   * Get user teams
   */
  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await this.db
      .select({
        team: teams
      })
      .from(userTeams)
      .innerJoin(teams, eq(userTeams.teamId, teams.id))
      .where(eq(userTeams.userId, userId));

    return result.map(r => r.team);
  }

  /**
   * Add user to team
   */
  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    const [newUserTeam] = await this.db.insert(userTeams).values(userTeam).returning();
    return newUserTeam;
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await this.db
      .delete(userTeams)
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ));
  }

  /**
   * Update team member role
   */
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

  /**
   * Get team members
   */
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

  /**
   * Get team statistics
   */
  async getTeamStatistics(teamId: number): Promise<any> {
    // Implementar estatísticas específicas do time
    const members = await this.getTeamMembers(teamId);
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isOnline).length,
      teamId
    };
  }

  /**
   * Get team by macrosetor/teamType
   */
  async getTeamByMacrosetor(teamType: string): Promise<Team | undefined> {
    const [team] = await this.db.select().from(teams).where(eq(teams.teamType, teamType));
    return team;
  }

  /**
   * Transfer conversation between teams and log the transfer
   */
  async transferConversationBetweenTeams(
    conversationId: number, 
    fromTeamId: number | null, 
    toTeamId: number, 
    reason?: string,
    transferredBy?: string
  ): Promise<void> {
    // Update conversation team assignment
    await this.db
      .update(conversations)
      .set({ 
        assignedTeamId: toTeamId,
        updatedAt: new Date() 
      })
      .where(eq(conversations.id, conversationId));

    // Log the transfer
    await this.db.insert(teamTransferHistory).values({
      conversationId,
      fromTeamId,
      toTeamId,
      reason,
      transferredBy
    });
  }

  /**
   * Get transfer history with team and contact details
   */
  async getTransferHistory(limit: number = 50): Promise<any[]> {
    const history = await this.db
      .select({
        id: teamTransferHistory.id,
        conversationId: teamTransferHistory.conversationId,
        fromTeamId: teamTransferHistory.fromTeamId,
        toTeamId: teamTransferHistory.toTeamId,
        reason: teamTransferHistory.reason,
        transferredBy: teamTransferHistory.transferredBy,
        transferredAt: teamTransferHistory.transferredAt,
        fromTeamName: teams.name,
        contactName: contacts.name,
      })
      .from(teamTransferHistory)
      .leftJoin(teams, eq(teamTransferHistory.fromTeamId, teams.id))
      .leftJoin(conversations, eq(teamTransferHistory.conversationId, conversations.id))
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(teamTransferHistory.transferredAt))
      .limit(limit);

    // Get "to team" names in a separate query since we can't join the same table twice easily
    const enrichedHistory = await Promise.all(
      history.map(async (item) => {
        const toTeam = await this.getTeam(item.toTeamId);
        return {
          ...item,
          toTeamName: toTeam?.name || 'Equipe removida',
          fromTeamName: item.fromTeamName || 'Não atribuída',
          contactName: item.contactName || 'Contato sem nome'
        };
      })
    );

    return enrichedHistory;
  }
}