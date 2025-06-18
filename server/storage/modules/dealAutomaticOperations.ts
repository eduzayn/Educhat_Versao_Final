import { BaseStorage } from "../base/BaseStorage";
import { deals, contacts, teams, funnels, type Deal, type InsertDeal } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DealAutomaticOperations extends BaseStorage {
  async createAutomaticDeal(contactId: number, canalOrigem?: string, teamType?: string, initialStage?: string): Promise<Deal> {
    console.log(`🔍 Iniciando verificação para criação de deal: contactId=${contactId}, canal=${canalOrigem}, teamType=${teamType}`);
    
    // Verificação robusta para evitar duplicação durante criação
    const { DealBasicOperations } = await import('./dealBasicOperations');
    const basicOps = new DealBasicOperations();
    const existingDeals = await basicOps.getDealsByContact(contactId);
    console.log(`📊 Deals existentes para contato ${contactId}: ${existingDeals.length} deals encontrados`);
    
    // Verificar se já existe qualquer deal ativo para este contato no mesmo canal
    const activeDealsSameChannel = existingDeals.filter(deal => {
      const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
      const sameChannel = deal.canalOrigem === canalOrigem;
      return isActive && sameChannel;
    });

    if (activeDealsSameChannel.length > 0) {
      console.log(`⚠️ BLOQUEIO: ${activeDealsSameChannel.length} deal(s) ativo(s) já existe(m) para contato ${contactId} no canal ${canalOrigem}`);
      activeDealsSameChannel.forEach(deal => {
        console.log(`   - Deal ID ${deal.id}: ${deal.name} (${deal.stage}) - criado em ${deal.createdAt}`);
      });
      return activeDealsSameChannel[0];
    }

    // Verificar se já existe um deal muito recente (últimas 2 horas) para este contato/canal
    const veryRecentDeals = existingDeals.filter(deal => {
      if (!deal.createdAt) return false;
      const dealDate = new Date(deal.createdAt!);
      const now = new Date();
      const hoursDiff = (now.getTime() - dealDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 2 && deal.canalOrigem === canalOrigem;
    });

    if (veryRecentDeals.length > 0) {
      console.log(`⚠️ BLOQUEIO: ${veryRecentDeals.length} deal(s) muito recente(s) encontrado(s) para contato ${contactId} no canal ${canalOrigem}`);
      veryRecentDeals.forEach(deal => {
        const hoursAgo = Math.round(((new Date().getTime() - new Date(deal.createdAt!).getTime()) / (1000 * 60 * 60)) * 100) / 100;
        console.log(`   - Deal ID ${deal.id}: ${deal.name} - criado há ${hoursAgo} horas`);
      });
      return veryRecentDeals[0];
    }

    // Get contact information
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, contactId));
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }

    // Find appropriate user based on team_type
    let assignedUserId = null;
    if (teamType) {
      const [team] = await this.db.select().from(teams).where(eq(teams.teamType, teamType));
      if (team) {
        // Aqui poderia implementar lógica para encontrar usuário disponível da equipe
        // assignedUserId = team.id;
      }
    }

    // Gerar nome único para o deal baseado no timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const dealName = `${contact.name} - ${teamType || 'Geral'}`;

    // Verificação final antes da criação para evitar condições de corrida
    const finalCheck = await basicOps.getDealsByContact(contactId);
    const lastMinuteActiveDeal = finalCheck.find(deal => {
      const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
      return isActive && deal.canalOrigem === canalOrigem;
    });

    if (lastMinuteActiveDeal) {
      console.log(`⚠️ Deal ativo detectado na verificação final para contato ${contactId}, retornando deal existente`);
      return lastMinuteActiveDeal;
    }

    // Usar estágio fornecido pelo serviço de funis ou fallback para compatibilidade
    const stage = initialStage || (() => {
      const stageMapping: { [key: string]: string } = {
        'comercial': 'prospecting',
        'suporte': 'solicitacao',
        'cobranca': 'pendencia-identificada',
        'secretaria': 'documentos-pendentes',
        'tutoria': 'duvida-academica',
        'financeiro': 'analise-inicial',
        'secretaria_pos': 'documentos-inicial'
      };
      return stageMapping[teamType || 'geral'] || 'prospecting';
    })();

    // Get the correct funnel for this teamType
    const funnel = await this.db.select()
      .from(funnels)
      .where(eq(funnels.teamType, teamType || 'geral'))
      .limit(1);

    const funnelId = funnel.length > 0 ? funnel[0].id : null;

    // Create automatic deal
    const dealData: InsertDeal = {
      name: dealName,
      contactId: contactId,
      funnelId: funnelId,
      stage: stage,
      value: 0,
      probability: 50,
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'automatic',
      teamType: teamType || 'geral',
      notes: `Deal criado automaticamente via ${canalOrigem || 'sistema'} em ${timestamp}`,
      tags: {
        automatic: true,
        canalOrigem,
        teamType: teamType,
        createdBy: 'system',
        timestamp: timestamp,
        funnelId: funnelId
      }
    };

    console.log(`💼 Criando deal automático: ${dealName} para ${contact.name}`);
    
    try {
      const newDeal = await basicOps.createDeal(dealData);
      console.log(`✅ Deal criado com sucesso: ID ${newDeal.id} para contato ${contactId}`);
      return newDeal;
    } catch (error) {
      console.error(`❌ Erro ao criar deal para contato ${contactId}:`, error);
      
      // Em caso de erro (possível duplicação por condição de corrida), 
      // tentar retornar um deal existente
      const fallbackDeals = await basicOps.getDealsByContact(contactId);
      const fallbackDeal = fallbackDeals.find(deal => {
        const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
        return isActive && deal.canalOrigem === canalOrigem;
      });
      
      if (fallbackDeal) {
        console.log(`🔄 Retornando deal existente como fallback: ID ${fallbackDeal.id}`);
        return fallbackDeal;
      }
      
      throw error;
    }
  }
} 