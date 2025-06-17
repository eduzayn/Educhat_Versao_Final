import { FunnelStage } from './funnel-types';

export const defaultStageTemplates: Record<string, FunnelStage[]> = {
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