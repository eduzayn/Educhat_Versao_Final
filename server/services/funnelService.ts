import { db } from '../core/db';
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
  teamType: string;
  teamId: number;
  stages: FunnelStage[];
  description?: string;
}

/**
 * Serviço para gestão de funis - Responsabilidade única: configuração e gestão de funis
 * Removidas sobreposições com dealAutomationService e crmService
 */
export class FunnelService {

  /**
   * Templates de estágios padrão por tipo de equipe
   * Responsabilidade: Definição de estruturas de funil
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
    generico: [
      { id: "novo", name: "Novo", order: 1, color: "bg-blue-500", probability: 30 },
      { id: "em_andamento", name: "Em Andamento", order: 2, color: "bg-orange-500", probability: 60 },
      { id: "concluido", name: "Concluído", order: 3, color: "bg-green-500", probability: 100 }
    ]
  };

  /**
   * Cria automaticamente um funil para uma nova equipe
   * Responsabilidade: Criação automática de funis
   */
  async createFunnelForTeam(teamId: number): Promise<boolean> {
    try {
      console.log(`🏗️ Criando funil automático para equipe ID: ${teamId}`);

      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (!team) {
        console.error(`❌ Equipe ${teamId} não encontrada`);
        return false;
      }

      const existingFunnel = await db
        .select()
        .from(funnels)
        .where(eq(funnels.teamType, team.teamType || 'generico'))
        .limit(1);

      if (existingFunnel.length > 0) {
        console.log(`⚠️ Funil já existe para tipo de equipe: ${team.teamType}`);
        return false;
      }

      const teamType = team.teamType || 'generico';
      const stages = this.defaultStageTemplates[teamType] || this.defaultStageTemplates.generico;

      const funnelData = {
        name: `Funil ${team.name}`,
        teamType: teamType,
        teamId: teamId,
        stages: stages,
        description: `Funil automático para ${team.description || team.name}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(funnels).values(funnelData);

      console.log(`✅ Funil criado automaticamente: ${funnelData.name} (${teamType})`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao criar funil automático:', error);
      return false;
    }
  }

  /**
   * Obter estágio inicial para um tipo de equipe
   * Responsabilidade: Fornecer configuração de estágios
   */
  async getInitialStageForTeamType(teamType: string): Promise<string> {
    const funnel = await this.getFunnelByTeamType(teamType);

    if (funnel && funnel.stages && funnel.stages.length > 0) {
      return funnel.stages[0].id;
    }

    const defaultStages = this.defaultStageTemplates[teamType] || this.defaultStageTemplates.generico;
    return defaultStages[0].id;
  }

  /**
   * Busca funil por tipo de equipe
   * Responsabilidade: Consulta de funis
   */
  async getFunnelByTeamType(teamType: string) {
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.teamType, teamType));
    return funnel;
  }

  /**
   * Buscar todos os funis
   * Responsabilidade: Listagem de funis
   */
  async getAllFunnels() {
    return await db.select().from(funnels);
  }

  /**
   * Validar se estágio existe no funil
   * Responsabilidade: Validação de estágios
   */
  async validateStageForTeamType(teamType: string, stageId: string): Promise<boolean> {
    const funnel = await this.getFunnelByTeamType(teamType);

    if (funnel && funnel.stages) {
      return funnel.stages.some((stage: any) => stage.id === stageId);
    }

    const defaultStages = this.defaultStageTemplates[teamType] || this.defaultStageTemplates.generico;
    return defaultStages.some(stage => stage.id === stageId);
  }

  /**
   * Operações de manutenção - criar funis faltantes
   * Responsabilidade: Manutenção e correção
   */
  async createMissingFunnels(): Promise<{ created: number; details: string[] }> {
    try {
      console.log('🔧 Iniciando criação de funis retroativos...');

      const allTeams = await db.select().from(teams);
      const existingFunnels = await db.select().from(funnels);
      const existingTeamTypes = new Set(existingFunnels.map(f => f.teamType));

      const details: string[] = [];
      let created = 0;

      for (const team of allTeams) {
        const teamType = team.teamType || 'generico';

        if (!existingTeamTypes.has(teamType)) {
          const success = await this.createFunnelForTeam(team.id);
          if (success) {
            created++;
            details.push(`Funil criado para ${team.name} (${teamType})`);
            existingTeamTypes.add(teamType);
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
}

export const funnelService = new FunnelService();