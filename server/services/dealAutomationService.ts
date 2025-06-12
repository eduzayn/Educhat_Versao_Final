
import { storage } from '../core/storage';
import { funnelService } from './funnelService';

/**
 * Serviço de automação de deals - Responsabilidade única: criação automática de deals
 * Consolidado para eliminar sobreposições com crmService e funnelService
 */
export class DealAutomationService {
  
  /**
   * Executa automação quando conversa é atribuída a equipe
   * Responsabilidade: Apenas criação de deals automáticos
   */
  async onConversationAssigned(conversationId: number, teamId: number, assignmentMethod: 'manual' | 'automatic') {
    try {
      console.log(`🔄 Iniciando automação de deal para conversa ${conversationId} → equipe ${teamId} (${assignmentMethod})`);
      
      // Buscar dados da conversa
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`❌ Conversa ${conversationId} não encontrada`);
        return null;
      }

      // Buscar dados da equipe para determinar teamType
      const team = await storage.getTeam(teamId);
      if (!team) {
        console.log(`❌ Equipe ${teamId} não encontrada`);
        return null;
      }

      const teamType = team.teamType || 'geral';
      const canalOrigem = conversation.channel || 'unknown';

      console.log(`📋 Dados para automação: contato=${conversation.contactId}, canal=${canalOrigem}, teamType=${teamType}`);

      // Verificar se deve criar deal (evitar duplicação)
      const shouldCreate = await this.shouldCreateAutomaticDeal(conversation.contactId, teamType);
      if (!shouldCreate) {
        console.log(`⚠️ Deal automático não criado - já existe deal ativo para contato ${conversation.contactId} no setor ${teamType}`);
        return null;
      }

      // Buscar estágio inicial correto do funil da equipe
      const initialStage = await funnelService.getInitialStageForTeamType(teamType);
      
      // Criar deal automático usando o sistema existente com estágio correto
      const deal = await storage.createAutomaticDeal(
        conversation.contactId,
        canalOrigem,
        teamType,
        initialStage
      );

      console.log(`✅ Deal criado automaticamente: ID ${deal.id} - ${deal.name}`);
      
      return deal;

    } catch (error) {
      console.error(`❌ Erro na automação de deal para conversa ${conversationId}:`, error);
      return null;
    }
  }

  /**
   * Verificar se deve criar deal automático
   * Responsabilidade: Validação de duplicação
   */
  async shouldCreateAutomaticDeal(contactId: number, teamType: string): Promise<boolean> {
    try {
      const existingDeals = await storage.getDealsByContact(contactId);
      
      // Verificar se já existe deal ativo no mesmo teamType
      const activeDealInSector = existingDeals.find(deal => {
        const isActive = !['closed', 'lost', 'closed_won', 'closed_lost'].includes(deal.stage);
        return isActive && deal.teamType === teamType;
      });

      return !activeDealInSector;
    } catch (error) {
      console.error('Erro ao verificar necessidade de deal automático:', error);
      return false;
    }
  }

  /**
   * Método para compatibilidade com handoffs
   * Responsabilidade: Interface para sistema de handoffs
   */
  async handleTeamAssignment(conversation: any, teamId: number) {
    return this.onConversationAssigned(conversation.id, teamId, 'manual');
  }
}

export const dealAutomationService = new DealAutomationService();
