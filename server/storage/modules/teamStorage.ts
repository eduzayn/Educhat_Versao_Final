import { BaseStorage } from "../base/BaseStorage";
import { teams, userTeams, systemUsers, type Team, type InsertTeam, type UserTeam, type InsertUserTeam, type SystemUser } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

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
   * Get team by team type (unified method)
   */
  async getTeamByTeamType(teamType: string): Promise<Team | undefined> {
    const [team] = await this.db.select()
      .from(teams)
      .where(and(
        eq(teams.teamType, teamType),
        eq(teams.isActive, true)
      ));
    return team;
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
   * Test team detection for automatic assignment
   */
  async testTeamDetection(messageContent: string): Promise<{ teamType: string; confidence: number } | null> {
    const keywords = {
      comercial: ['curso', 'matricula', 'inscrição', 'valor', 'preço', 'quero me inscrever', 'informações sobre'],
      suporte: ['problema', 'erro', 'não consigo', 'ajuda', 'suporte', 'dificuldade'],
      cobranca: ['pagamento', 'boleto', 'vencimento', 'atraso', 'financeiro', 'cobrança'],
      secretaria: ['certificado', 'documento', 'declaração', 'comprovante', 'histórico'],
      tutoria: ['dúvida', 'conteúdo', 'aula', 'material', 'exercício', 'atividade'],
      financeiro: ['desconto', 'parcelamento', 'forma de pagamento', 'cartão', 'pix']
    };

    const lowerMessage = messageContent.toLowerCase();
    let bestMatch = { teamType: '', confidence: 0 };

    for (const [teamType, teamKeywords] of Object.entries(keywords)) {
      let confidence = 0;
      for (const keyword of teamKeywords) {
        if (lowerMessage.includes(keyword)) {
          confidence += 1;
        }
      }
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { teamType, confidence: confidence / teamKeywords.length };
      }
    }

    return bestMatch.confidence > 0.3 ? bestMatch : null;
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
}