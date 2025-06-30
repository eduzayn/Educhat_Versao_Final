/**
 * Team storage module - manages team operations
 */

import { BaseStorage } from '../base/BaseStorage';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { 
  teams, 
  type Team, 
  type InsertTeam,
  userTeams, 
  type UserTeam, 
  type InsertUserTeam,
  systemUsers,
  type SystemUser,
  conversations,
  teamTransferHistory,
  quickReplies,
  type InsertTeamTransferHistory
} from '../../../shared/schema';

export class TeamStorage extends BaseStorage {
  /**
   * Get all teams
   */
  async getTeams(): Promise<Team[]> {
    return await this.db.select().from(teams);
  }

  /**
   * Get team by ID
   */
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await this.db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  /**
   * Create new team
   */
  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await this.db.insert(teams).values(team).returning();
    return result[0];
  }

  /**
   * Update team
   */
  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const result = await this.db.update(teams).set(team).where(eq(teams.id, id)).returning();
    return result[0];
  }

  /**
   * Delete team
   */
  async deleteTeam(id: number): Promise<void> {
    try {
      // Primeiro, limpar todas as dependências da equipe para evitar foreign key constraints
      
      // 1. Remover atribuições de conversas para esta equipe
      await this.db.update(conversations)
        .set({ assignedTeamId: null })
        .where(eq(conversations.assignedTeamId, id));
      
      // 2. Limpar transferências que referenciam esta equipe  
      await this.db.delete(teamTransferHistory)
        .where(eq(teamTransferHistory.toTeamId, id));
      
      await this.db.delete(teamTransferHistory)
        .where(eq(teamTransferHistory.fromTeamId, id));
      
      // 3. Remover membros da equipe
      await this.db.delete(userTeams)
        .where(eq(userTeams.teamId, id));
      
      // 4. Limpar quick replies da equipe
      await this.db.update(quickReplies)
        .set({ teamId: null })
        .where(eq(quickReplies.teamId, id));
      
      // 5. Remover atribuição de usuários para esta equipe
      await this.db.update(systemUsers)
        .set({ teamId: null })
        .where(eq(systemUsers.teamId, id));
      
      // 6. Finalmente, excluir a equipe
      await this.db.delete(teams).where(eq(teams.id, id));
      
      console.log(`✅ Equipe ${id} excluída com sucesso após limpeza de dependências`);
    } catch (error) {
      console.error(`❌ Erro ao excluir equipe ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get team by type (unified method)
   */
  async getTeamByType(teamType: string): Promise<Team | undefined> {
    const result = await this.db
      .select()
      .from(teams)
      .where(eq(teams.teamType, teamType))
      .limit(1);
    
    return result[0];
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
    const userTeamsList = await this.db
      .select({
        team: teams
      })
      .from(userTeams)
      .innerJoin(teams, eq(userTeams.teamId, teams.id))
      .where(eq(userTeams.userId, userId));

    return userTeamsList.map(ut => ut.team);
  }

  /**
   * Add user to team
   */
  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    const result = await this.db.insert(userTeams).values(userTeam).returning();
    return result[0];
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await this.db.delete(userTeams).where(
      and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      )
    );
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<UserTeam> {
    const result = await this.db
      .update(userTeams)
      .set({ role })
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ))
      .returning();
    
    return result[0];
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: number): Promise<Array<{ user: SystemUser; role: string }>> {
    const members = await this.db
      .select({
        user: systemUsers,
        role: userTeams.role
      })
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(eq(userTeams.teamId, teamId))
      .orderBy(
        asc(sql`COALESCE(${systemUsers.displayName}, ${systemUsers.username})`)
      );

    return members;
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: number): Promise<{
    memberCount: number;
    activeConversations: number;
    onlineMembers: number;
  }> {
    // Get member count
    const memberCountResult = await this.db
      .select()
      .from(userTeams)
      .where(eq(userTeams.teamId, teamId));

    // Get active conversations count
    const activeConversationsResult = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.assignedTeamId, teamId));

    // Get online members count
    const onlineMembersResult = await this.db
      .select()
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(and(
        eq(userTeams.teamId, teamId),
        eq(systemUsers.isOnline, true)
      ));

    return {
      memberCount: memberCountResult.length,
      activeConversations: activeConversationsResult.length,
      onlineMembers: onlineMembersResult.length
    };
  }

  /**
   * Get team by teamType
   */
  async getTeamByTeamType(teamType: string): Promise<Team | undefined> {
    const result = await this.db
      .select()
      .from(teams)
      .where(eq(teams.teamType, teamType))
      .limit(1);
    
    return result[0];
  }

  /**
   * Transfer conversation between teams and log the transfer
   */
  async transferConversation(
    conversationId: number,
    fromTeamId: number | null,
    toTeamId: number,
    transferredBy: number,
    reason: string
  ): Promise<void> {
    // Update conversation
    await this.db
      .update(conversations)
      .set({ 
        assignedTeamId: toTeamId,
        assignedUserId: null // Reset user assignment when transferring teams
      })
      .where(eq(conversations.id, conversationId));

    // Log the transfer
    await this.db.insert(teamTransferHistory).values({
      conversationId,
      fromTeamId,
      toTeamId,
      transferredBy,
      reason,
      transferredAt: new Date()
    } as InsertTeamTransferHistory);
  }

  /**
   * Get transfer history with team and contact details
   */
  async getTransferHistory(limit: number = 50): Promise<Array<{
    id: number;
    conversationId: number;
    fromTeamName: string | null;
    toTeamName: string;
    transferredBy: string;
    reason: string;
    transferredAt: Date;
    contactName: string;
    contactPhone: string;
  }>> {
    const transfers = await this.db
      .select({
        id: teamTransferHistory.id,
        conversationId: teamTransferHistory.conversationId,
        fromTeamId: teamTransferHistory.fromTeamId,
        toTeamId: teamTransferHistory.toTeamId,
        transferredBy: teamTransferHistory.transferredBy,
        reason: teamTransferHistory.reason,
        transferredAt: teamTransferHistory.transferredAt,
        conversation: conversations,
        fromTeam: teams,
        toTeam: teams,
        transferredByUser: systemUsers
      })
      .from(teamTransferHistory)
      .leftJoin(conversations, eq(teamTransferHistory.conversationId, conversations.id))
      .leftJoin(teams, eq(teamTransferHistory.fromTeamId, teams.id))
      .leftJoin(teams, eq(teamTransferHistory.toTeamId, teams.id))
      .leftJoin(systemUsers, eq(teamTransferHistory.transferredBy, systemUsers.id))
      .orderBy(desc(teamTransferHistory.transferredAt))
      .limit(limit);

    // This would need to be enhanced with proper joins for contact details
    return transfers.map(t => ({
      id: t.id,
      conversationId: t.conversationId,
      fromTeamName: t.fromTeam?.name || null,
      toTeamName: t.toTeam?.name || 'Unknown Team',
      transferredBy: t.transferredByUser?.username || 'Unknown User',
      reason: t.reason,
      transferredAt: t.transferredAt,
      contactName: 'Contact Name', // Would need proper join
      contactPhone: 'Contact Phone' // Would need proper join
    }));
  }
}