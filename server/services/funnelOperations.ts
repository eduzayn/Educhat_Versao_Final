import { db } from '../db';
import { funnels, teams } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { defaultStageTemplates } from './funnelTemplates';

export class FunnelOperations {
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

      // Verificar se já existe funil para este tipo de equipe
      const existingFunnel = await db
        .select()
        .from(funnels)
        .where(eq(funnels.teamType, team.teamType || 'generico'))
        .limit(1);

      if (existingFunnel.length > 0) {
        console.log(`⚠️ Funil já existe para tipo de equipe: ${team.teamType}`);
        return false;
      }

      // Determinar estágios baseado no tipo de equipe
      const teamType = team.teamType || 'generico';
      const stages = defaultStageTemplates[teamType] || defaultStageTemplates.generico;
      
      // Criar funil
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
   * Resolve casos retroativos criando funis para equipes existentes sem funil
   */
  async createMissingFunnels(): Promise<{ created: number; details: string[] }> {
    try {
      console.log('🔧 Iniciando criação de funis retroativos...');
      
      // Buscar todas as equipes
      const allTeams = await db.select().from(teams);
      
      // Buscar funis existentes
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
            existingTeamTypes.add(teamType); // Evitar duplicatas
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
   * Busca funil por tipo de equipe (método unificado)
   */
  async getFunnelByTeamType(teamType: string) {
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.teamType, teamType));
    return funnel;
  }

  /**
   * Obter estágio inicial para um tipo de equipe
   */
  async getInitialStageForTeamType(teamType: string): Promise<string> {
    const funnel = await this.getFunnelByTeamType(teamType);
    
    if (funnel && funnel.stages && funnel.stages.length > 0) {
      return funnel.stages[0].id;
    }
    
    // Retornar estágio padrão se não encontrar funil
    const defaultStages = defaultStageTemplates[teamType] || defaultStageTemplates.generico;
    return defaultStages[0].id;
  }

  /**
   * Buscar todos os funis
   */
  async getAllFunnels() {
    return await db.select().from(funnels);
  }
} 