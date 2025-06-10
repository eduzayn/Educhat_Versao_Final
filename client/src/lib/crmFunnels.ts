/**
 * Configuração unificada dos funis de vendas do CRM
 * Define os funis disponíveis e suas respectivas etapas
 */

export interface Stage {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Funnel {
  id: string;
  name: string;
  description: string;
  color: string;
  stages: Stage[];
}

export const CRM_FUNNELS: Record<string, Funnel> = {
  comercial: {
    id: 'comercial',
    name: 'Equipe Comercial',
    description: 'Vendas, matrículas e informações sobre cursos',
    color: 'green',
    stages: [
      { id: 'prospecting', name: 'Prospecção', color: 'bg-gray-500', description: 'Lead inicial identificado' },
      { id: 'qualified', name: 'Qualificado', color: 'bg-blue-500', description: 'Lead qualificado e com interesse' },
      { id: 'proposal', name: 'Proposta', color: 'bg-yellow-500', description: 'Proposta enviada ao cliente' },
      { id: 'negotiation', name: 'Negociação', color: 'bg-orange-500', description: 'Em processo de negociação' },
      { id: 'won', name: 'Fechado - Ganho', color: 'bg-green-500', description: 'Venda realizada com sucesso' },
      { id: 'lost', name: 'Fechado - Perdido', color: 'bg-red-500', description: 'Oportunidade perdida' }
    ]
  },
  suporte: {
    id: 'suporte',
    name: 'Equipe Suporte',
    description: 'Problemas técnicos e dificuldades de acesso',
    color: 'blue',
    stages: [
      { id: 'novo', name: 'Novo', color: 'bg-red-500', description: 'Ticket recém criado' },
      { id: 'em_andamento', name: 'Em Andamento', color: 'bg-orange-500', description: 'Problema sendo investigado' },
      { id: 'aguardando_cliente', name: 'Aguardando Cliente', color: 'bg-yellow-500', description: 'Aguardando retorno do cliente' },
      { id: 'resolvido', name: 'Resolvido', color: 'bg-green-500', description: 'Problema solucionado' },
      { id: 'fechado', name: 'Fechado', color: 'bg-gray-500', description: 'Ticket encerrado' }
    ]
  },
  cobranca: {
    id: 'cobranca',
    name: 'Equipe Cobrança',
    description: 'Questões financeiras e pagamentos',
    color: 'orange',
    stages: [
      { id: 'debito_detectado', name: 'Débito Detectado', color: 'bg-red-500', description: 'Inadimplência identificada' },
      { id: 'tentativa_contato', name: 'Tentativa de Contato', color: 'bg-orange-500', description: 'Contactando o cliente' },
      { id: 'negociacao', name: 'Negociação', color: 'bg-yellow-500', description: 'Negociando forma de pagamento' },
      { id: 'acordo_feito', name: 'Acordo Feito', color: 'bg-blue-500', description: 'Acordo de pagamento estabelecido' },
      { id: 'quitado', name: 'Quitado', color: 'bg-green-500', description: 'Débito quitado' },
      { id: 'encerrado', name: 'Encerrado', color: 'bg-gray-500', description: 'Processo encerrado' }
    ]
  },
  secretaria: {
    id: 'secretaria',
    name: 'Secretaria',
    description: 'Documentos e processos acadêmicos',
    color: 'purple',
    stages: [
      { id: 'solicitacao', name: 'Solicitação', color: 'bg-purple-500', description: 'Solicitação recebida' },
      { id: 'documentos_pendentes', name: 'Documentos Pendentes', color: 'bg-yellow-500', description: 'Aguardando documentação' },
      { id: 'em_analise', name: 'Em Análise', color: 'bg-blue-500', description: 'Documentos em análise' },
      { id: 'aprovado', name: 'Aprovado', color: 'bg-green-500', description: 'Solicitação aprovada' },
      { id: 'finalizado', name: 'Finalizado', color: 'bg-gray-500', description: 'Processo concluído' }
    ]
  },
  tutoria: {
    id: 'tutoria',
    name: 'Tutoria',
    description: 'Dúvidas acadêmicas e orientação',
    color: 'indigo',
    stages: [
      { id: 'duvida_recebida', name: 'Dúvida Recebida', color: 'bg-indigo-500', description: 'Dúvida acadêmica recebida' },
      { id: 'em_analise', name: 'Em Análise', color: 'bg-blue-500', description: 'Analisando a questão' },
      { id: 'orientacao_fornecida', name: 'Orientação Fornecida', color: 'bg-yellow-500', description: 'Orientação enviada ao aluno' },
      { id: 'acompanhamento', name: 'Acompanhamento', color: 'bg-orange-500', description: 'Acompanhando evolução' },
      { id: 'resolvido', name: 'Resolvido', color: 'bg-green-500', description: 'Dúvida esclarecida' }
    ]
  },
  financeiro: {
    id: 'financeiro',
    name: 'Financeiro Aluno',
    description: 'Questões financeiras estudantis',
    color: 'emerald',
    stages: [
      { id: 'solicitacao_recebida', name: 'Solicitação Recebida', color: 'bg-emerald-500', description: 'Solicitação financeira recebida' },
      { id: 'documentos_em_analise', name: 'Documentos em Análise', color: 'bg-blue-500', description: 'Analisando documentação' },
      { id: 'processamento', name: 'Processamento', color: 'bg-yellow-500', description: 'Processando solicitação' },
      { id: 'aguardando_confirmacao', name: 'Aguardando Confirmação', color: 'bg-orange-500', description: 'Aguardando confirmação' },
      { id: 'concluido', name: 'Concluído', color: 'bg-green-500', description: 'Processo finalizado' }
    ]
  },
  secretaria_pos: {
    id: 'secretaria_pos',
    name: 'Secretaria Pós',
    description: 'Processos de pós-graduação',
    color: 'violet',
    stages: [
      { id: 'inscricao', name: 'Inscrição', color: 'bg-violet-500', description: 'Processo de inscrição' },
      { id: 'documentos_pos', name: 'Documentos Pós', color: 'bg-yellow-500', description: 'Documentação específica pós' },
      { id: 'validacao', name: 'Validação', color: 'bg-blue-500', description: 'Validando requisitos' },
      { id: 'matricula_pos', name: 'Matrícula Pós', color: 'bg-green-500', description: 'Matrícula efetivada' },
      { id: 'finalizado_pos', name: 'Finalizado', color: 'bg-gray-500', description: 'Processo concluído' }
    ]
  }
};

/**
 * Obtém um funil pelo ID
 */
export function getFunnel(funnelId: string): Funnel | undefined {
  return CRM_FUNNELS[funnelId];
}

/**
 * Obtém todas as etapas de um funil
 */
export function getFunnelStages(funnelId: string): Stage[] {
  const funnel = getFunnel(funnelId);
  return funnel ? funnel.stages : [];
}

/**
 * Obtém uma etapa específica de um funil
 */
export function getStage(funnelId: string, stageId: string): Stage | undefined {
  const stages = getFunnelStages(funnelId);
  return stages.find(stage => stage.id === stageId);
}

/**
 * Obtém lista de todos os funis disponíveis
 */
export function getAllFunnels(): Funnel[] {
  return Object.values(CRM_FUNNELS);
}

/**
 * Verifica se uma etapa existe em um funil
 */
export function isValidStage(funnelId: string, stageId: string): boolean {
  const stages = getFunnelStages(funnelId);
  return stages.some(stage => stage.id === stageId);
}

/**
 * Obtém a próxima etapa no funil
 */
export function getNextStage(funnelId: string, currentStageId: string): Stage | undefined {
  const stages = getFunnelStages(funnelId);
  const currentIndex = stages.findIndex(stage => stage.id === currentStageId);
  
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  
  return undefined;
}

/**
 * Obtém a etapa anterior no funil
 */
export function getPreviousStage(funnelId: string, currentStageId: string): Stage | undefined {
  const stages = getFunnelStages(funnelId);
  const currentIndex = stages.findIndex(stage => stage.id === currentStageId);
  
  if (currentIndex > 0) {
    return stages[currentIndex - 1];
  }
  
  return undefined;
}