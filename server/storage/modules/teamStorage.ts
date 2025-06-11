import { BaseStorage } from "../base/BaseStorage";
import { teams, userTeams, systemUsers, teamDetection, teamDetectionKeywords, type Team, type InsertTeam, type UserTeam, type InsertUserTeam, type SystemUser } from "../../../shared/schema";
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
   * Get team by team type (alias for compatibility)
   */
  async getTeamByMacrosetor(teamType: string): Promise<Team | undefined> {
    return this.getTeamByTeamType(teamType);
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
   * Test team detection based on message content
   */
  async testTeamDetection(text: string): Promise<{ team: string | null; confidence: number; matchedKeywords: string[] }> {
    try {
      // Normalizar texto para busca
      const normalizedContent = text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
      
      // Buscar todas as detecções ativas com suas palavras-chave
      const detections = await this.db
        .select()
        .from(teamDetection)
        .where(eq(teamDetection.isActive, true));
      
      let bestMatch = {
        team: null as string | null,
        confidence: 0,
        matchedKeywords: [] as string[]
      };
      
      for (const detection of detections) {
        const keywords = await this.db
          .select()
          .from(teamDetectionKeywords)
          .where(and(
            eq(teamDetectionKeywords.teamDetectionId, detection.id),
            eq(teamDetectionKeywords.isActive, true)
          ));
        
        let score = 0;
        const matched: string[] = [];
        
        for (const keyword of keywords) {
          const normalizedKeyword = keyword.keyword.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          if (normalizedContent.includes(normalizedKeyword)) {
            score += keyword.weight || 1;
            matched.push(keyword.keyword);
          }
        }
        
        // Aplicar prioridade da detecção
        score *= (detection.priority || 1);
        
        if (score > bestMatch.confidence) {
          bestMatch = {
            team: detection.name,
            confidence: score,
            matchedKeywords: matched
          };
        }
      }
      
      return bestMatch;
    } catch (error) {
      console.error('Erro na detecção de equipe:', error);
      return { team: null, confidence: 0, matchedKeywords: [] };
    }
  }

  /**
   * Get all team detections
   */
  async getTeamDetections(): Promise<any[]> {
    return this.db.select().from(teamDetection);
  }

  /**
   * Get team detection by ID
   */
  async getTeamDetection(id: number): Promise<any> {
    const [detection] = await this.db.select().from(teamDetection).where(eq(teamDetection.id, id));
    return detection;
  }

  /**
   * Create team detection
   */
  async createTeamDetection(data: any): Promise<any> {
    const [newDetection] = await this.db.insert(teamDetection).values(data).returning();
    return newDetection;
  }

  /**
   * Update team detection
   */
  async updateTeamDetection(id: number, data: any): Promise<any> {
    const [updatedDetection] = await this.db
      .update(teamDetection)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teamDetection.id, id))
      .returning();
    return updatedDetection;
  }

  /**
   * Delete team detection
   */
  async deleteTeamDetection(id: number): Promise<void> {
    await this.db.delete(teamDetection).where(eq(teamDetection.id, id));
  }

  /**
   * Get team detection keywords
   */
  async getTeamDetectionKeywords(teamDetectionId: number): Promise<any[]> {
    return this.db
      .select()
      .from(teamDetectionKeywords)
      .where(eq(teamDetectionKeywords.teamDetectionId, teamDetectionId));
  }

  /**
   * Create team detection keyword
   */
  async createTeamDetectionKeyword(teamDetectionId: number, data: any): Promise<any> {
    const [newKeyword] = await this.db
      .insert(teamDetectionKeywords)
      .values({ ...data, teamDetectionId })
      .returning();
    return newKeyword;
  }

  /**
   * Delete team detection keyword
   */
  async deleteTeamDetectionKeyword(teamDetectionId: number, keywordId: number): Promise<void> {
    await this.db
      .delete(teamDetectionKeywords)
      .where(and(
        eq(teamDetectionKeywords.teamDetectionId, teamDetectionId),
        eq(teamDetectionKeywords.id, keywordId)
      ));
  }
}