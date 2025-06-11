import { db } from '../db';
import { funnels, teams, deals } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  probability?: number;
}

export interface CreateFunnelData {
  name: string;
  macrosetor: string;
  teamId: number;
  stages: FunnelStage[];
  description?: string;
}

/**
 * Serviço para gestão automática de funis por equipe
 */
export class FunnelService {
  
  /**
   * Templates de estágios padrão por tipo de macrosetor
   */
  private defaultStageTemplates: Record<string, FunnelStage[]> = {
    comercial: [
      { id: "prospecting", name: "Prospecção", order: 1, color: "bg-blue-500", probability: 20 },
      { id: "qualified", name: "Qualificado", order: 2, color: "bg-purple-500", probability: 40 },
      { id: "proposal", name: "Proposta", order: 3, color: "bg-orange-500", probability: 60 },
      { id: "negotiation", name: "Negociação", order: 4, color: "bg-yellow-500", probability: 80 },
      { id: "closed_won", name: "Fechado Ganho", order: 5, color: "bg-green-500", probability: 100 },
      { id: "closed_lost", name: "Fechado Perdido", order: 6, color: "bg-red-500", probability: 0 }
    ],
    suporte: [
      { id: "solicitacao", name: "Solicitação", order: 1, color: "bg-blue-500", probability: 30 },
      { id: "em_analise", name: "Em Análise", order: 2, color: "bg-purple-500", probability: 50 },
      { id: "em_andamento", name: "Em Andamento", order: 3, color: "bg-orange-500", probability: 70 },
      { id: "aguardando_cliente", name: "Aguardando Cliente", order: 4, color: "bg-yellow-500", probability: 60 },
      { id: "resolvido", name: "Resolvido", order: 5, color: "bg-green-500", probability: 95 },
      { id: "fechado", name: "Fechado", order: 6, color: "bg-gray-500", probability: 100 }
    ],
    financeiro: [
      { id: "solicitacao_recebida", name: "Solicitação Recebida", order: 1, color: "bg-blue-500", probability: 30 },
      { id: "em_analise", name: "Em Análise", order: 2, color: "bg-purple-500", probability: 50 },
      { id: "processando", name: "Processando", order: 3, color: "bg-orange-500", probability: 70 },
      { id: "aprovado", name: "Aprovado", order: 4, color: "bg-green-500", probability: 90 },
      { id: "negado", name: "Negado", order: 5, color: "bg-red-500", probability: 0 },
      { id: "concluido", name: "Concluído", order: 6, color: "bg-gray-500", probability: 100 }
    ],
    secretaria: [
      { id: "documentos-pendentes", name: "Documentos Pendentes", order: 1, color: "bg-blue-500", probability: 40 },
      { id: "em_analise", name: "Em Análise", order: 2, color: "bg-purple-500", probability: 60 },
      { id: "processando", name: "Processando", order: 3, color: "bg-orange-500", probability: 70 },
      { id: "aprovado", name: "Aprovado", order: 4, color: "bg-green-500", probability: 90 },
      { id: "matriculado", name: "Matriculado", order: 5, color: "bg-green-600", probability: 95 },
      { id: "concluido", name: "Concluído", order: 6, color: "bg-gray-500", probability: 100 }
    ],
    tutoria: [
      { id: "nova_solicitacao", name: "Nova Solicitação", order: 1, color: "bg-blue-500", probability: 40 },
      { id: "atribuido", name: "Atribuído", order: 2, color: "bg-purple-500", probability: 60 },
      { id: "em_andamento", name: "Em Andamento", order: 3, color: "bg-orange-500", probability: 70 },
      { id: "aguardando_aluno", name: "Aguardando Aluno", order: 4, color: "bg-yellow-500", probability: 50 },
      { id: "resolvido", name: "Resolvido", order: 5, color: "bg-green-500", probability: 95 },
      { id: "fechado", name: "Fechado", order: 6, color: "bg-gray-500", probability: 100 }
    ],
    secretaria_pos: [
      { id: "documentos-pendentes", name: "Documentos Pendentes", order: 1, color: "bg-blue-500", probability: 45 },
      { id: "verificacao_requisitos", name: "Verificação de Requisitos", order: 2, color: "bg-purple-500", probability: 55 },
      { id: "processando", name: "Processando", order: 3, color: "bg-orange-500", probability: 70 },
      { id: "pronto_formatura", name: "Pronto para Formatura", order: 4, color: "bg-green-500", probability: 90 },
      { id: "formado", name: "Formado", order: 5, color: "bg-green-600", probability: 100 }
    ],
    cobranca: [
      { id: "inadimplente", name: "Inadimplente", order: 1, color: "bg-red-500", probability: 25 },
      { id: "primeiro_contato", name: "Primeiro Contato", order: 2, color: "bg-orange-500", probability: 35 },
      { id: "negociando", name: "Negociando", order: 3, color: "bg-yellow-500", probability: 65 },
      { id: "acordo_feito", name: "Acordo Feito", order: 4, color: "bg-blue-500", probability: 75 },
      { id: "pagamento_efetuado", name: "Pagamento Efetuado", order: 5, color: "bg-green-500", probability: 100 },
      { id: "cobranca_juridica", name: "Cobrança Jurídica", order: 6, color: "bg-red-600", probability: 15 }
    ],
    // Template genérico para macrosetores desconhecidos
    generico: [
      { id: "novo", name: "Novo", order: 1, color: "bg-blue-500", probability: 30 },
      { id: "em_andamento", name: "Em Andamento", order: 2, color: "bg-orange-500", probability: 60 },
      { id: "concluido", name: "Concluído", order: 3, color: "bg-green-500", probability: 100 }
    ]
  };

  /**
   * Cria automaticamente um funil para uma nova equipe
   */
  async createFunnelForTeam(teamId: number): Promise<boolean> {
    try {
      console.log(`🏗️ Criando funil automático para equipe ID: ${teamId}`);
      
      // Buscar dados da equipe
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (!team) {
        console.error(`❌ Equipe ${teamId} não encontrada`);
        return false;
      }

      // Verificar se já existe funil para este macrosetor
      const existingFunnel = await db
        .select()
        .from(funnels)
        .where(eq(funnels.macrosetor, team.macrosetor || 'generico'))
        .limit(1);

      if (existingFunnel.length > 0) {
        console.log(`⚠️ Funil já existe para macrosetor: ${team.macrosetor}`);
        return false;
      }

      // Determinar estágios baseado no macrosetor
      const macrosetor = team.macrosetor || 'generico';
      const stages = this.defaultStageTemplates[macrosetor] || this.defaultStageTemplates.generico;
      
      // Criar funil
      const funnelData = {
        name: `Funil ${team.name}`,
        macrosetor: macrosetor,
        teamId: teamId,
        stages: stages,
        description: `Funil automático para ${team.description || team.name}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(funnels).values(funnelData);

      console.log(`✅ Funil criado automaticamente: ${funnelData.name} (${macrosetor})`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao criar funil automático:', error);
      return false;
    }
  }

  /**
   * Resolve casos retroativos criando funis para equipes existentes sem funil
   */
  async createMissingFunnels(): Promise<{ created: number; details: string[] }> {
    try {
      console.log('🔧 Iniciando criação de funis retroativos...');
      
      // Buscar todas as equipes
      const allTeams = await db.select().from(teams);
      
      // Buscar funis existentes
      const existingFunnels = await db.select().from(funnels);
      const existingMacrosetores = new Set(existingFunnels.map(f => f.macrosetor));
      
      const details: string[] = [];
      let created = 0;
      
      for (const team of allTeams) {
        const macrosetor = team.macrosetor || 'generico';
        
        if (!existingMacrosetores.has(macrosetor)) {
          const success = await this.createFunnelForTeam(team.id);
          if (success) {
            created++;
            details.push(`Funil criado para ${team.name} (${macrosetor})`);
            existingMacrosetores.add(macrosetor); // Evitar duplicatas
          }
        }
      }
      
      console.log(`✅ Criação retroativa concluída: ${created} funis criados`);
      return { created, details };
      
    } catch (error) {
      console.error('❌ Erro na criação retroativa de funis:', error);
      return { created: 0, details: [`Erro: ${error}`] };
    }
  }

  /**
   * Atualiza deals existentes para usar funis corretos
   */
  async updateDealsToCorrectFunnels(): Promise<{ updated: number; details: string[] }> {
    try {
      console.log('🔄 Atualizando deals para funis corretos...');
      
      // Buscar todos os funis
      const allFunnels = await db.select().from(funnels);
      const funnelsByMacrosetor = new Map(allFunnels.map(f => [f.macrosetor, f]));
      
      // Buscar deals com macrosetores incorretos ou sem correspondência
      const dealsToUpdate = await db
        .select()
        .from(deals)
        .where(eq(deals.isActive, true));
      
      const details: string[] = [];
      let updated = 0;
      
      for (const deal of dealsToUpdate) {
        const funnel = funnelsByMacrosetor.get(deal.macrosetor);
        
        if (funnel) {
          // Verificar se o estágio atual existe no funil
          const validStages = funnel.stages.map((s: any) => s.id);
          
          if (!validStages.includes(deal.stage)) {
            // Atualizar para primeiro estágio do funil correto
            const firstStage = funnel.stages[0];
            
            await db
              .update(deals)
              .set({
                stage: firstStage.id,
                updatedAt: new Date()
              })
              .where(eq(deals.id, deal.id));
            
            updated++;
            details.push(`Deal "${deal.name}" atualizado: ${deal.stage} → ${firstStage.id}`);
          }
        }
      }
      
      console.log(`✅ Atualização de deals concluída: ${updated} deals atualizados`);
      return { updated, details };
      
    } catch (error) {
      console.error('❌ Erro na atualização de deals:', error);
      return { updated: 0, details: [`Erro: ${error}`] };
    }
  }

  /**
   * Busca funil por macrosetor
   */
  async getFunnelByMacrosetor(macrosetor: string) {
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.macrosetor, macrosetor))
      .limit(1);
    
    return funnel || null;
  }

  /**
   * Busca primeiro estágio de um funil
   */
  async getInitialStageForMacrosetor(macrosetor: string): Promise<string> {
    const funnel = await this.getFunnelByMacrosetor(macrosetor);
    
    if (funnel && funnel.stages && funnel.stages.length > 0) {
      const sortedStages = funnel.stages.sort((a: any, b: any) => a.order - b.order);
      return sortedStages[0].id;
    }
    
    // Fallback para estágios padrão se não encontrar funil
    const defaultStages = this.defaultStageTemplates[macrosetor] || this.defaultStageTemplates.generico;
    return defaultStages[0].id;
  }

  /**
   * Lista todos os funis ativos
   */
  async getAllFunnels() {
    return await db
      .select()
      .from(funnels)
      .where(eq(funnels.isActive, true));
  }
}

export const funnelService = new FunnelService();