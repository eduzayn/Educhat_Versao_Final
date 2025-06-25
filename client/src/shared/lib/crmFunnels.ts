/**
 * Sistema de funis do CRM - extraído do DealsModule para uso compartilhado
 */

export interface Stage {
  id: string;
  name: string;
  color: string;
}

export interface TeamCategory {
  name: string;
  description?: string;
  color: string;
  stages: Stage[];
}

// Configuração unificada dos funis por equipe/categoria (extraída do DealsModule existente)
export const teamCategories: Record<string, TeamCategory> = {
  comercial: {
    name: 'Equipe Comercial',
    description: 'Vendas, matrículas e informações sobre cursos',
    color: 'green',
    stages: [
      { id: 'prospecting', name: 'Prospecção', color: 'bg-gray-500' },
      { id: 'qualified', name: 'Qualificado', color: 'bg-blue-500' },
      { id: 'proposal', name: 'Proposta', color: 'bg-yellow-500' },
      { id: 'negotiation', name: 'Negociação', color: 'bg-orange-500' },
      { id: 'won', name: 'Fechado', color: 'bg-green-500' }
    ]
  },
  suporte: {
    name: 'Equipe Suporte',
    description: 'Problemas técnicos e dificuldades de acesso',
    color: 'blue',
    stages: [
      { id: 'novo', name: 'Novo', color: 'bg-red-500' },
      { id: 'em_andamento', name: 'Em Andamento', color: 'bg-orange-500' },
      { id: 'aguardando_cliente', name: 'Aguardando Cliente', color: 'bg-yellow-500' },
      { id: 'resolvido', name: 'Resolvido', color: 'bg-green-500' }
    ]
  },
  cobranca: {
    name: 'Equipe Cobrança',
    description: 'Questões financeiras e pagamentos',
    color: 'orange',
    stages: [
      { id: 'debito_detectado', name: 'Débito Detectado', color: 'bg-red-500' },
      { id: 'tentativa_contato', name: 'Tentativa de Contato', color: 'bg-orange-500' },
      { id: 'negociacao', name: 'Negociação', color: 'bg-yellow-500' },
      { id: 'quitado', name: 'Quitado', color: 'bg-green-500' },
      { id: 'encerrado', name: 'Encerrado', color: 'bg-gray-500' }
    ]
  },
  secretaria: {
    name: 'Secretaria',
    description: 'Documentos e processos acadêmicos',
    color: 'purple',
    stages: [
      { id: 'solicitacao', name: 'Solicitação', color: 'bg-purple-500' },
      { id: 'documentos_pendentes', name: 'Documentos Pendentes', color: 'bg-yellow-500' },
      { id: 'em_analise', name: 'Em Análise', color: 'bg-blue-500' },
      { id: 'aprovado', name: 'Aprovado', color: 'bg-green-500' },
      { id: 'finalizado', name: 'Finalizado', color: 'bg-gray-500' }
    ]
  },
  tutoria: {
    name: 'Tutoria',
    description: 'Dúvidas acadêmicas e orientação',
    color: 'indigo',
    stages: [
      { id: 'duvida_recebida', name: 'Dúvida Recebida', color: 'bg-indigo-500' },
      { id: 'em_analise', name: 'Em Análise', color: 'bg-blue-500' },
      { id: 'orientacao_fornecida', name: 'Orientação Fornecida', color: 'bg-yellow-500' },
      { id: 'acompanhamento', name: 'Acompanhamento', color: 'bg-orange-500' },
      { id: 'resolvido', name: 'Resolvido', color: 'bg-green-500' }
    ]
  },
  financeiro: {
    name: 'Financeiro Aluno',
    description: 'Questões financeiras estudantis',
    color: 'emerald',
    stages: [
      { id: 'solicitacao_recebida', name: 'Solicitação Recebida', color: 'bg-emerald-500' },
      { id: 'documentos_em_analise', name: 'Documentos em Análise', color: 'bg-blue-500' },
      { id: 'processamento', name: 'Processamento', color: 'bg-yellow-500' },
      { id: 'aguardando_confirmacao', name: 'Aguardando Confirmação', color: 'bg-orange-500' },
      { id: 'concluido', name: 'Concluído', color: 'bg-green-500' }
    ]
  },
  secretaria_pos: {
    name: 'Secretaria Pós',
    description: 'Processos de pós-graduação',
    color: 'violet',
    stages: [
      { id: 'solicitacao_certificado', name: 'Solicitação Certificado', color: 'bg-violet-500' },
      { id: 'validacao_conclusao', name: 'Validação Conclusão', color: 'bg-blue-500' },
      { id: 'emissao_certificado', name: 'Emissão Certificado', color: 'bg-yellow-500' },
      { id: 'pronto_retirada', name: 'Pronto para Retirada', color: 'bg-orange-500' },
      { id: 'entregue', name: 'Entregue', color: 'bg-green-500' }
    ]
  }
};

/**
 * Obtém as etapas de um funil específico
 */
export function getStagesForCategory(category: string): Stage[] {
  return teamCategories[category]?.stages || [];
}

/**
 * Obtém informações de um funil específico
 */
export function getCategoryInfo(category: string): TeamCategory | undefined {
  return teamCategories[category];
}

/**
 * Obtém todos os funis disponíveis
 */
export function getAllCategories(): Array<{ id: string; info: TeamCategory }> {
  return Object.entries(teamCategories).map(([id, info]) => ({ id, info }));
}