import { db } from '../core/db';
import { eq, count } from 'drizzle-orm';
import { teams, userTeams, systemUsers, conversations } from '../../shared/schema';
import { AIService, MessageClassification } from './aiService';

export interface HandoffRecommendation {
  teamId?: number;
  userId?: number;
  confidence: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedWaitTime: number;
  alternativeOptions: Array<{
    teamId?: number;
    userId?: number;
    reason: string;
    confidence: number;
  }>;
}

export interface TeamCapacity {
  teamId: number;
  teamName: string;
  teamType: string;
  activeUsers: number;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  priority: number;
  isActive: boolean;
}

export class AssignmentAnalysisService {
  private aiService: AIService;
  private defaultCriteria = {
    confidenceThreshold: 60
  };

  constructor() {
    this.aiService = new AIService();
  }

  async analyzeIntelligentAssignment(
    conversationId: number,
    messageContent: string,
    getConversationContext: (id: number) => Promise<any>,
    analyzeTeamCapacities: () => Promise<TeamCapacity[]>,
    selectBestTeamForClassification: (ai: MessageClassification, teams: TeamCapacity[]) => TeamCapacity | null,
    calculateAssignmentConfidence: (ai: MessageClassification, team: TeamCapacity, conversation: any) => number,
    mapUrgencyToPriority: (urgency: string) => 'low' | 'normal' | 'high' | 'urgent',
    calculateWaitTime: (team: TeamCapacity) => number,
    getAlternativeTeams: (teams: TeamCapacity[], excludeTeamId: number) => Array<{ teamId: number; reason: string; confidence: number }>
  ): Promise<HandoffRecommendation> {
    const conversation = await getConversationContext(conversationId);
    if (!conversation) throw new Error('Conversa não encontrada');
    const aiClassification = await this.aiService.classifyMessage(
      messageContent,
      conversation.contactId,
      conversationId,
      []
    );
    const teamCapacities = await analyzeTeamCapacities();
    const bestTeam = selectBestTeamForClassification(aiClassification, teamCapacities);
    if (!bestTeam) {
      return {
        confidence: 0,
        reason: 'Nenhuma equipe disponível',
        priority: 'low',
        estimatedWaitTime: 0,
        alternativeOptions: []
      };
    }
    const confidence = calculateAssignmentConfidence(aiClassification, bestTeam, conversation);
    return {
      teamId: bestTeam.teamId,
      confidence,
      reason: `IA detectou intenção: ${aiClassification.intent} • Equipe ${bestTeam.teamName} especializada em ${bestTeam.teamType} • Capacidade atual: ${Math.round(bestTeam.utilizationRate)}%`,
      priority: mapUrgencyToPriority(aiClassification.urgency),
      estimatedWaitTime: calculateWaitTime(bestTeam),
      alternativeOptions: getAlternativeTeams(teamCapacities, bestTeam.teamId)
    };
  }

  async analyzeBestAssignment(analyzeTeamCapacities: () => Promise<TeamCapacity[]>): Promise<HandoffRecommendation> {
    const teamCapacities = await analyzeTeamCapacities();
    const bestTeam = teamCapacities.filter(team => team.isActive).sort((a, b) => a.utilizationRate - b.utilizationRate)[0];
    if (!bestTeam) throw new Error('Nenhuma equipe disponível');
    return {
      teamId: bestTeam.teamId,
      confidence: 80,
      reason: `Equipe ${bestTeam.teamName} com menor carga atual (${Math.round(bestTeam.utilizationRate)}%)`,
      priority: 'normal',
      estimatedWaitTime: bestTeam.utilizationRate < 30 ? 2 : bestTeam.utilizationRate < 70 ? 5 : Math.min(15, bestTeam.activeUsers * 2),
      alternativeOptions: []
    };
  }
}

export const assignmentAnalysisService = new AssignmentAnalysisService(); 