import { storage } from "../storage";
import { funnelService } from './funnelService';

export class DealAutomationService {
  async createAutomaticDeal(conversationId: number, teamId: number): Promise<number | null> {
    try {
      const conversation = await storage.conversation.getConversation(conversationId);
      if (!conversation) {
        console.log(`❌ Conversa ${conversationId} não encontrada para automação de deal`);
        return null;
      }
      const team = await storage.getTeam(teamId);
      if (!team) {
        console.log(`❌ Equipe ${teamId} não encontrada para automação de deal`);
        return null;
      }
      const teamType = team.teamType || 'geral';
      const canalOrigem = conversation.channel || 'unknown';
      console.log(`🔄 Criando deal automático: contato=${conversation.contactId}, canal=${canalOrigem}, teamType=${teamType}`);
      await funnelService.getInitialStageForTeamType(teamType);
      const deal = await storage.createAutomaticDeal(
        conversation.contactId,
        canalOrigem,
        teamType
      );
      console.log(`✅ Deal criado automaticamente: ID ${deal.id} - ${deal.name}`);
      return deal.id;
    } catch (error) {
      console.error(`❌ Erro na automação de deal para conversa ${conversationId}:`, error);
      return null;
    }
  }
}

export const dealAutomationService = new DealAutomationService(); 