export const funnelMapping = {
  'course_inquiry': { teamType: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
  'lead_generation': { teamType: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
  'pricing_inquiry': { teamType: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
  'technical_support': { teamType: 'suporte', stages: ['new_ticket', 'in_analysis', 'in_progress', 'waiting_user', 'resolved', 'closed'] },
  'complaint': { teamType: 'suporte', stages: ['new_complaint', 'investigating', 'escalated', 'resolving', 'resolved', 'closed'] },
  'platform_issue': { teamType: 'suporte', stages: ['new_ticket', 'in_analysis', 'in_progress', 'waiting_user', 'resolved', 'closed'] },
  'certificate_analysis': { teamType: 'suporte', stages: ['received', 'under_analysis', 'documentation_needed', 'approved', 'denied', 'completed'] },
  'documentation': { teamType: 'suporte', stages: ['received', 'under_review', 'missing_docs', 'approved', 'rejected', 'completed'] },
  'student_support': { teamType: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
  'academic_support': { teamType: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
  'study_help': { teamType: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
  'financial': { teamType: 'financeiro', stages: ['payment_issue', 'under_review', 'documentation_needed', 'payment_plan', 'resolved', 'closed'] },
  'refund_request': { teamType: 'financeiro', stages: ['request_received', 'under_analysis', 'approved', 'processing', 'completed', 'denied'] },
  'billing': { teamType: 'cobranca', stages: ['overdue', 'first_contact', 'negotiating', 'payment_plan', 'resolved', 'collection'] },
  'payment_delay': { teamType: 'cobranca', stages: ['overdue', 'first_contact', 'negotiating', 'payment_plan', 'resolved', 'collection'] },
  'enrollment': { teamType: 'secretaria', stages: ['initial_contact', 'documentation', 'processing', 'approved', 'enrolled', 'completed'] },
  'certificate': { teamType: 'secretaria', stages: ['requested', 'processing', 'ready', 'delivered', 'completed'] },
  'academic_record': { teamType: 'secretaria', stages: ['requested', 'processing', 'ready', 'delivered', 'completed'] },
  'graduation': { teamType: 'secretaria_pos', stages: ['requirements_check', 'documentation', 'processing', 'approved', 'graduation_ready', 'completed'] },
  'postgrad_support': { teamType: 'secretaria_pos', stages: ['initial_contact', 'documentation', 'processing', 'approved', 'enrolled', 'completed'] },
  'thesis_support': { teamType: 'secretaria_pos', stages: ['requirements_check', 'documentation', 'processing', 'approved', 'in_progress', 'completed'] }
};

export const stageClassification = {
  comercial: {
    'prospecting': ['interesse', 'quero saber', 'tenho dúvida', 'como funciona', 'valor', 'preço', 'curso', 'informação'],
    'qualified': ['preciso de', 'urgente', 'quando posso', 'como me inscrever', 'documentos', 'requisitos', 'prazo'],
    'proposal': ['proposta', 'orçamento', 'condições', 'desconto', 'parcelamento', 'valor final', 'modalidade'],
    'negotiation': ['aceito', 'vou pensar', 'conversar', 'decidir', 'família', 'esposo', 'esposa', 'avaliar'],
    'closed_won': ['fechar', 'aceito a proposta', 'vamos fazer', 'confirmo', 'pode prosseguir'],
    'closed_lost': ['não tenho interesse', 'muito caro', 'cancelar', 'desistir', 'não quero mais']
  },
  suporte: {
    'new_ticket': ['problema', 'não funciona', 'erro', 'bug', 'não consigo', 'ajuda', 'dificuldade'],
    'in_analysis': ['analisando', 'verificando', 'checando', 'investigando', 'avaliando'],
    'in_progress': ['trabalhando', 'resolvendo', 'corrigindo', 'ajustando', 'processando'],
    'waiting_user': ['aguardando', 'preciso que', 'envie', 'confirme', 'informe'],
    'resolved': ['resolvido', 'funcionando', 'corrigido', 'solucionado'],
    'received': ['recebido', 'protocolo', 'registrado', 'solicitação'],
    'under_analysis': ['em análise', 'avaliando', 'verificando documentos'],
    'documentation_needed': ['falta documento', 'enviar', 'pendente'],
    'approved': ['aprovado', 'deferido', 'aceito', 'validado'],
    'denied': ['negado', 'indeferido', 'rejeitado', 'não aprovado']
  },
  tutoria: {
    'new_request': ['dúvida', 'não entendi', 'explicar', 'ajuda com', 'como fazer'],
    'assigned': ['designado', 'atribuído', 'responsável'],
    'in_progress': ['explicando', 'orientando', 'ajudando', 'ensinando'],
    'waiting_student': ['aguardando aluno', 'precisa praticar', 'fazer exercício'],
    'resolved': ['entendido', 'esclarecido', 'resolvido', 'obrigado pela ajuda']
  },
  financeiro: {
    'payment_issue': ['não consegui pagar', 'problema pagamento', 'erro cobrança', 'cartão negado'],
    'under_review': ['revisão', 'analisando pagamento', 'verificando'],
    'documentation_needed': ['enviar comprovante', 'documentos', 'boleto'],
    'payment_plan': ['parcelamento', 'condições pagamento', 'negociar', 'renegociar'],
    'request_received': ['solicitar reembolso', 'quero cancelar', 'estorno'],
    'under_analysis': ['analisando solicitação', 'em avaliação'],
    'processing': ['processando', 'em andamento'],
    'completed': ['reembolsado', 'estornado', 'finalizado']
  },
  cobranca: {
    'overdue': ['atrasado', 'vencido', 'pendente', 'em atraso'],
    'first_contact': ['primeiro contato', 'notificação', 'lembrete'],
    'negotiating': ['negociar', 'conversar', 'acordo', 'parcelar'],
    'payment_plan': ['parcelamento', 'acordo', 'nova data', 'condições'],
    'collection': ['cobrança judicial', 'protesto', 'serasa']
  },
  secretaria: {
    'initial_contact': ['quero me matricular', 'inscrição', 'início'],
    'documentation': ['documentos', 'papéis', 'enviar', 'histórico'],
    'processing': ['processando', 'em análise', 'tramitando'],
    'approved': ['aprovado', 'aceito', 'deferido'],
    'enrolled': ['matriculado', 'inscrito', 'ativo'],
    'requested': ['solicitar', 'pedir', 'preciso de'],
    'ready': ['pronto', 'disponível', 'finalizado'],
    'delivered': ['entregue', 'enviado', 'recebido']
  },
  secretaria_pos: {
    'requirements_check': ['requisitos', 'critérios', 'exigências', 'pré-requisitos'],
    'graduation_ready': ['formatura', 'colação', 'cerimônia', 'diploma'],
    'thesis_support': ['tcc', 'dissertação', 'tese', 'trabalho final'],
    'postgrad_support': ['pós-graduação', 'especialização', 'mestrado', 'doutorado']
  }
}; 