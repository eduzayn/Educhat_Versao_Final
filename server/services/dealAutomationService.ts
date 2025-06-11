// DEPRECATED: Este serviço foi consolidado em unifiedAssignmentService.ts
// Mantido para compatibilidade durante migração
import { storage } from '../core/storage';
import { funnelService } from './funnelService';

/**
 * Serviço de automação de deals - Sistema simplificado
 * Cria deals automaticamente quando conversas são atribuídas a equipes
 */
export class DealAutomationService {
  
  /**
   * Executa automação quando conversa é atribuída a equipe
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

      // Buscar dados da equipe para determinar macrosetor
      const team = await storage.getTeam(teamId);
      if (!team) {
        console.log(`❌ Equipe ${teamId} não encontrada`);
        return null;
      }

      const macrosetor = team.macrosetor || 'geral';
      const canalOrigem = conversation.channel || 'unknown';

      console.log(`📋 Dados para automação: contato=${conversation.contactId}, canal=${canalOrigem}, macrosetor=${macrosetor}`);

      // Buscar estágio inicial correto do funil da equipe
      const initialStage = await funnelService.getInitialStageForMacrosetor(macrosetor);
      
      // Criar deal automático usando o sistema existente com estágio correto
      const deal = await storage.createAutomaticDeal(
        conversation.contactId,
        canalOrigem,
        macrosetor,
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
   * Mapear estágios iniciais por macrosetor
   */
  private getInitialStageByMacrosetor(macrosetor: string): string {
    const stageMapping: { [key: string]: string } = {
      'comercial': 'prospecting',
      'suporte': 'atendimento-inicial',
      'cobranca': 'pendencia-identificada', 
      'secretaria': 'solicitacao-recebida',
      'tutoria': 'duvida-identificada',
      'financeiro': 'analise-inicial',
      'secretaria_pos': 'documentos-inicial'
    };

    return stageMapping[macrosetor] || 'prospecting';
  }

  /**
   * Verificar se deve criar deal automático
   */
  async shouldCreateAutomaticDeal(contactId: number, macrosetor: string): Promise<boolean> {
    try {
      const existingDeals = await storage.getDealsByContact(contactId);
      
      // Verificar se já existe deal ativo no mesmo macrosetor
      const activeDealInSector = existingDeals.find(deal => {
        const isActive = !['closed', 'lost', 'closed_won', 'closed_lost'].includes(deal.stage);
        return isActive && deal.macrosetor === macrosetor;
      });

      return !activeDealInSector;
    } catch (error) {
      console.error('Erro ao verificar necessidade de deal automático:', error);
      return false;
    }
  }

  /**
   * Método para compatibilidade com handoffs
   */
  async handleTeamAssignment(conversation: any, teamId: number) {
    return this.onConversationAssigned(conversation.id, teamId, 'manual');
  }
}

export const dealAutomationService = new DealAutomationService();