import { MessageClassification } from './aiService';
import { TeamCapacity } from './assignmentAnalysisService';

export function selectBestTeamForClassification(
  aiClassification: MessageClassification,
  teamCapacities: TeamCapacity[]
): TeamCapacity | null {
  const intentToTeamType: { [key: string]: string } = {
    'billing_inquiry': 'financeiro',
    'technical_support': 'suporte',
    'complaint': 'suporte',
    'sales_interest': 'comercial',
    'general_info': 'tutoria',
    'course_question': 'tutoria',
    'schedule_request': 'secretaria'
  };
  const preferredTeamType = intentToTeamType[aiClassification.intent];
  const availableTeams = teamCapacities.filter(team => team.isActive && team.utilizationRate < 80);
  if (availableTeams.length === 0) return null;
  if (preferredTeamType) {
    const specializedTeam = availableTeams.find(team => team.teamType === preferredTeamType);
    if (specializedTeam) return specializedTeam;
  }
  return availableTeams[0];
}

export function calculateAssignmentConfidence(
  aiClassification: MessageClassification,
  team: TeamCapacity,
  conversation: any
): number {
  let confidence = 50;
  if (aiClassification.intent && teamSpecializedInIntent(team.teamType, aiClassification.intent)) confidence += 30;
  if (team.utilizationRate < 50) confidence += 15;
  else if (team.utilizationRate < 80) confidence += 5;
  if (aiClassification.urgency === 'high' || aiClassification.urgency === 'critical') confidence += 10;
  if (aiClassification.frustrationLevel > 7 && !teamSpecializedInIntent(team.teamType, aiClassification.intent)) confidence -= 20;
  return Math.min(100, Math.max(0, confidence));
}

function teamSpecializedInIntent(teamType: string, intent: string): boolean {
  const specializations: { [key: string]: string[] } = {
    'financeiro': ['billing_inquiry'],
    'suporte': ['technical_support', 'complaint'],
    'comercial': ['sales_interest'],
    'tutoria': ['general_info', 'course_question'],
    'secretaria': ['schedule_request']
  };
  return specializations[teamType]?.includes(intent) || false;
}

export function mapUrgencyToPriority(urgency: string): 'low' | 'normal' | 'high' | 'urgent' {
  const mapping: { [key: string]: 'low' | 'normal' | 'high' | 'urgent' } = {
    'low': 'low',
    'normal': 'normal',
    'high': 'high',
    'critical': 'urgent'
  };
  return mapping[urgency] || 'normal';
}

export function calculateWaitTime(team: TeamCapacity): number {
  if (team.utilizationRate < 30) return 2;
  if (team.utilizationRate < 70) return 5;
  return Math.min(15, team.activeUsers * 2);
}

export function getAlternativeTeams(
  teamCapacities: TeamCapacity[],
  excludeTeamId: number
): Array<{ teamId: number; reason: string; confidence: number }> {
  return teamCapacities
    .filter(team => team.teamId !== excludeTeamId && team.isActive && team.utilizationRate < 90)
    .slice(0, 2)
    .map(team => ({
      teamId: team.teamId,
      reason: `${team.teamName} - ${Math.round(team.utilizationRate)}% utilização`,
      confidence: Math.max(0, 70 - team.utilizationRate)
    }));
} 