import { BaseStorage } from '../base/BaseStorage';
import { userTeams, systemUsers } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class TeamDetectionOperations extends BaseStorage {
  async getAvailableUserFromTeam(teamId: number): Promise<any | undefined> {
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
} 