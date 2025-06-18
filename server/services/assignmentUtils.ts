// Definir tipo MessageClassification localmente para evitar dependência circular
interface MessageClassification {
  intent: string;
  sentiment: string;
  confidence: number;
  urgency: string;
  frustrationLevel: number;
}
import { TeamCapacity } from './assignmentAnalysisService';

export function selectBestTeamForClassification(
  aiClassification: MessageClassification,
  teamCapacities: TeamCapacity[]
): TeamCapacity | null {
  // REGRAS CRÍTICAS: Nunca misturar tipos de atendimento
  const intentToTeamType: { [key: string]: string } = {
    // COMERCIAL - apenas vendas e leads
    'lead_generation': 'comercial',
    'sales_interest': 'comercial', 
    'course_inquiry': 'comercial',
    'pricing_question': 'comercial',
    'enrollment_interest': 'comercial',
    
    // FINANCEIRO - apenas pagamentos e cobrança
    'billing_inquiry': 'financeiro',
    'payment_issue': 'financeiro',
    'invoice_request': 'financeiro',
    
    // SUPORTE - apenas problemas técnicos
    'technical_support': 'suporte',
    'platform_issue': 'suporte',
    'login_problem': 'suporte',
    
    // RECLAMAÇÕES sempre para suporte (não comercial)
    'complaint': 'suporte',
    'service_complaint': 'suporte',
    
    // TUTORIA - apenas alunos matriculados
    'student_support': 'tutoria',
    'course_question': 'tutoria',
    'academic_support': 'tutoria',
    
    // SECRETARIA - apenas processos administrativos
    'schedule_request': 'secretaria',
    'document_request': 'secretaria',
    'general_info': 'secretaria'
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
    'comercial': ['lead_generation', 'sales_interest', 'course_inquiry', 'pricing_question', 'enrollment_interest'],
    'financeiro': ['billing_inquiry', 'payment_issue', 'invoice_request'],
    'suporte': ['technical_support', 'platform_issue', 'login_problem', 'complaint', 'service_complaint'],
    'tutoria': ['student_support', 'course_question', 'academic_support'],
    'secretaria': ['schedule_request', 'document_request', 'general_info']
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