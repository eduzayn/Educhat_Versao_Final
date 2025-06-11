import { db } from '../core/db';
import { contacts, conversations, deals } from '../../shared/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export interface CRMAction {
  type: 'create_lead' | 'update_stage' | 'add_tag' | 'send_link' | 'schedule_followup' | 'transfer_team';
  contactId: number;
  conversationId: number;
  data: any;
  automated: boolean;
}

export interface LeadData {
  name?: string;
  email?: string;
  phone: string;
  courseInterest?: string;
  leadSource: string;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export class CRMService {
  
  /**
   * Mapas de classificação inteligente para funis e etapas baseados nas equipes reais
   */
  private funnelMapping = {
    // COMERCIAL - Equipe Comercial (ID: 5)
    'course_inquiry': { macrosetor: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
    'lead_generation': { macrosetor: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
    'pricing_inquiry': { macrosetor: 'comercial', stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
    
    // SUPORTE - Equipe Suporte (ID: 6)
    'technical_support': { macrosetor: 'suporte', stages: ['new_ticket', 'in_analysis', 'in_progress', 'waiting_user', 'resolved', 'closed'] },
    'complaint': { macrosetor: 'suporte', stages: ['new_complaint', 'investigating', 'escalated', 'resolving', 'resolved', 'closed'] },
    'platform_issue': { macrosetor: 'suporte', stages: ['new_ticket', 'in_analysis', 'in_progress', 'waiting_user', 'resolved', 'closed'] },
    
    // SUPORTE ESPECIALIZADO - ANÁLISE PARA CERTIFICAÇÃO (ID: 12)
    'certificate_analysis': { macrosetor: 'suporte', stages: ['received', 'under_analysis', 'documentation_needed', 'approved', 'denied', 'completed'] },
    
    // SUPORTE ESPECIALIZADO - DOCUMENTAÇÃO (ID: 13)  
    'documentation': { macrosetor: 'suporte', stages: ['received', 'under_review', 'missing_docs', 'approved', 'rejected', 'completed'] },
    
    // TUTORIA - Equipe Tutoria (ID: 9)
    'student_support': { macrosetor: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
    'academic_support': { macrosetor: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
    'study_help': { macrosetor: 'tutoria', stages: ['new_request', 'assigned', 'in_progress', 'waiting_student', 'resolved', 'closed'] },
    
    // FINANCEIRO - Equipe Financeiro (ID: 7)
    'financial': { macrosetor: 'financeiro', stages: ['payment_issue', 'under_review', 'documentation_needed', 'payment_plan', 'resolved', 'closed'] },
    'refund_request': { macrosetor: 'financeiro', stages: ['request_received', 'under_analysis', 'approved', 'processing', 'completed', 'denied'] },
    
    // COBRANÇA - Equipe Cobrança (ID: 11)
    'billing': { macrosetor: 'cobranca', stages: ['overdue', 'first_contact', 'negotiating', 'payment_plan', 'resolved', 'collection'] },
    'payment_delay': { macrosetor: 'cobranca', stages: ['overdue', 'first_contact', 'negotiating', 'payment_plan', 'resolved', 'collection'] },
    
    // SECRETARIA - Equipe Secretaria (ID: 8)
    'enrollment': { macrosetor: 'secretaria', stages: ['initial_contact', 'documentation', 'processing', 'approved', 'enrolled', 'completed'] },
    'certificate': { macrosetor: 'secretaria', stages: ['requested', 'processing', 'ready', 'delivered', 'completed'] },
    'academic_record': { macrosetor: 'secretaria', stages: ['requested', 'processing', 'ready', 'delivered', 'completed'] },
    
    // SECRETARIA PÓS - Equipe Secretaria Pós (ID: 10)
    'graduation': { macrosetor: 'secretaria_pos', stages: ['requirements_check', 'documentation', 'processing', 'approved', 'graduation_ready', 'completed'] },
    'postgrad_support': { macrosetor: 'secretaria_pos', stages: ['initial_contact', 'documentation', 'processing', 'approved', 'enrolled', 'completed'] },
    'thesis_support': { macrosetor: 'secretaria_pos', stages: ['requirements_check', 'documentation', 'processing', 'approved', 'in_progress', 'completed'] }
  };

  private stageClassification = {
    // COMERCIAL - Equipe Comercial
    comercial: {
      'prospecting': ['interesse', 'quero saber', 'tenho dúvida', 'como funciona', 'valor', 'preço', 'curso', 'informação'],
      'qualified': ['preciso de', 'urgente', 'quando posso', 'como me inscrever', 'documentos', 'requisitos', 'prazo'],
      'proposal': ['proposta', 'orçamento', 'condições', 'desconto', 'parcelamento', 'valor final', 'modalidade'],
      'negotiation': ['aceito', 'vou pensar', 'conversar', 'decidir', 'família', 'esposo', 'esposa', 'avaliar'],
      'closed_won': ['fechar', 'aceito a proposta', 'vamos fazer', 'confirmo', 'pode prosseguir'],
      'closed_lost': ['não tenho interesse', 'muito caro', 'cancelar', 'desistir', 'não quero mais']
    },
    
    // SUPORTE - Equipe Suporte, Análise Certificação, Documentação
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
    
    // TUTORIA - Equipe Tutoria  
    tutoria: {
      'new_request': ['dúvida', 'não entendi', 'explicar', 'ajuda com', 'como fazer'],
      'assigned': ['designado', 'atribuído', 'responsável'],
      'in_progress': ['explicando', 'orientando', 'ajudando', 'ensinando'],
      'waiting_student': ['aguardando aluno', 'precisa praticar', 'fazer exercício'],
      'resolved': ['entendido', 'esclarecido', 'resolvido', 'obrigado pela ajuda']
    },
    
    // FINANCEIRO - Equipe Financeiro
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
    
    // COBRANÇA - Equipe Cobrança
    cobranca: {
      'overdue': ['atrasado', 'vencido', 'pendente', 'em atraso'],
      'first_contact': ['primeiro contato', 'notificação', 'lembrete'],
      'negotiating': ['negociar', 'conversar', 'acordo', 'parcelar'],
      'payment_plan': ['parcelamento', 'acordo', 'nova data', 'condições'],
      'collection': ['cobrança judicial', 'protesto', 'serasa']
    },
    
    // SECRETARIA - Equipe Secretaria
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
    
    // SECRETARIA PÓS - Equipe Secretaria Pós
    secretaria_pos: {
      'requirements_check': ['requisitos', 'critérios', 'exigências', 'pré-requisitos'],
      'graduation_ready': ['formatura', 'colação', 'cerimônia', 'diploma'],
      'thesis_support': ['tcc', 'dissertação', 'tese', 'trabalho final'],
      'postgrad_support': ['pós-graduação', 'especialização', 'mestrado', 'doutorado']
    }
  };

  /**
   * Executa ações automáticas baseadas na classificação da IA
   */
  async executeAutomatedActions(
    classification: any,
    contactId: number,
    conversationId: number,
    message: string
  ): Promise<CRMAction[]> {
    const actions: CRMAction[] = [];
    
    try {
      // Buscar contato existente
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId));

      if (!contact) {
        console.warn(`⚠️ Contato ${contactId} não encontrado`);
        return actions;
      }

      // Automação de deals removida - agora feita via handoffs simplificados

      // Ação 2: Adicionar tags automáticas
      const tagAction = await this.addAutomaticTags(contact, classification);
      if (tagAction) actions.push(tagAction);

    } catch (error) {
      console.error('❌ Erro ao executar ações automáticas CRM:', error);
    }

    return actions;
  }



  // Métodos de classificação inteligente removidos - substituídos por automação simplificada

  // Métodos auxiliares de cálculo removidos - não necessários com automação simplificada

  // Métodos de criação de leads via Prof. Ana removidos - substituídos por automação simplificada

  /**
   * Adiciona tags automáticas baseadas na classificação
   */
  private async addAutomaticTags(
    contact: any,
    classification: any
  ): Promise<CRMAction | null> {
    try {
      const newTags: string[] = [];
      
      // Tags baseadas na intenção
      switch (classification.intent) {
        case 'lead_generation':
          newTags.push('lead-quente');
          break;
        case 'course_inquiry':
          newTags.push('interessado-curso');
          break;
        case 'student_support':
          newTags.push('aluno-ativo');
          break;
        case 'complaint':
          newTags.push('reclamacao');
          break;
        case 'financial':
          newTags.push('questao-financeira');
          break;
      }

      // Tags baseadas no sentimento
      if (classification.sentiment === 'excited') {
        newTags.push('muito-interessado');
      } else if (classification.sentiment === 'frustrated') {
        newTags.push('frustrado');
      }

      // Tags baseadas no perfil
      if (classification.userProfile.type === 'lead') {
        newTags.push(`lead-${classification.userProfile.stage}`);
      }

      // Tags baseadas na urgência
      if (classification.urgency === 'high' || classification.urgency === 'critical') {
        newTags.push('alta-prioridade');
      }

      if (newTags.length > 0) {
        // Combinar com tags existentes
        const currentTags = contact.tags || [];
        const uniqueTags = Array.from(new Set([...currentTags, ...newTags]));

        await db
          .update(contacts)
          .set({ 
            tags: uniqueTags,
            updatedAt: new Date()
          })
          .where(eq(contacts.id, contact.id));

        return {
          type: 'add_tag',
          contactId: contact.id,
          conversationId: 0,
          data: { tags: newTags },
          automated: true
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erro ao adicionar tags:', error);
      return null;
    }
  }

  // Métodos auxiliares de classificação inteligente e integração complexa removidos
}

export const crmService = new CRMService();