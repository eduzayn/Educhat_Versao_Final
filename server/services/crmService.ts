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

      // Ação 1: Registrar/atualizar lead se for interesse em curso
      if (classification.isLead && classification.intent === 'course_inquiry') {
        const leadAction = await this.createOrUpdateLead(contact, classification, message);
        if (leadAction) actions.push(leadAction);
      }

      // Ação 2: Adicionar tags automáticas
      const tagAction = await this.addAutomaticTags(contact, classification);
      if (tagAction) actions.push(tagAction);

      // Ação 3: Enviar links úteis
      const linkAction = await this.sendRelevantLinks(classification, contactId, conversationId);
      if (linkAction) actions.push(linkAction);

      // Ação 4: Programar follow-up para leads quentes
      if (classification.isLead && classification.frustrationLevel <= 3) {
        const followupAction = await this.scheduleFollowup(contactId, conversationId, classification);
        if (followupAction) actions.push(followupAction);
      }

      // Ação 5: Transferir para equipe especializada se necessário
      if (classification.urgency === 'high' || classification.frustrationLevel >= 7) {
        const transferAction = await this.transferToTeam(classification.suggestedTeam, contactId, conversationId);
        if (transferAction) actions.push(transferAction);
      }

      console.log(`✅ ${actions.length} ações automáticas executadas para contato ${contactId}`);
      
    } catch (error) {
      console.error('❌ Erro ao executar ações automáticas:', error);
    }

    return actions;
  }

  /**
   * Cria ou atualiza lead no CRM
   */
  private async createOrUpdateLead(
    contact: any,
    classification: any,
    message: string
  ): Promise<CRMAction | null> {
    try {
      // Extrair curso de interesse da mensagem
      const courseInterest = this.extractCourseInterest(message, classification.contextKeywords);
      
      // Determinar estágio do funil baseado na intenção
      const stage = this.determineFunnelStage(classification);
      
      // Verificar se já existe deal para este contato
      const [existingDeal] = await db
        .select()
        .from(deals)
        .where(eq(deals.contactId, contact.id))
        .orderBy(desc(deals.createdAt))
        .limit(1);

      let dealData = {
        name: `Lead: ${contact.name} - ${courseInterest}`,
        contactId: contact.id,
        value: this.estimateDealValue(courseInterest),
        stage: stage,
        status: 'active',
        source: 'whatsapp_ai',
        priority: classification.urgency === 'high' ? 'high' : 'medium',
        metadata: {
          aiClassification: classification,
          courseInterest: courseInterest,
          leadQuality: this.assessLeadQuality(classification),
          lastMessage: message,
          automatedAt: new Date().toISOString()
        }
      };

      if (existingDeal) {
        // Atualizar deal existente
        await db
          .update(deals)
          .set({
            ...dealData,
            updatedAt: new Date()
          })
          .where(eq(deals.id, existingDeal.id));
      } else {
        // Criar novo deal
        await db.insert(deals).values(dealData);
      }

      return {
        type: existingDeal ? 'update_stage' : 'create_lead',
        contactId: contact.id,
        conversationId: 0, // Será preenchido pelo caller
        data: dealData,
        automated: true
      };

    } catch (error) {
      console.error('❌ Erro ao criar/atualizar lead:', error);
      return null;
    }
  }

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

  /**
   * Envia links relevantes baseados na intenção
   */
  private async sendRelevantLinks(
    classification: any,
    contactId: number,
    conversationId: number
  ): Promise<CRMAction | null> {
    const links: { [key: string]: string } = {
      'course_inquiry': 'https://educhat.com/cursos',
      'student_support': 'https://educhat.com/aluno/acesso',
      'financial': 'https://educhat.com/financeiro/boletos',
      'lead_generation': 'https://educhat.com/matricula'
    };

    const relevantLink = links[classification.intent];

    if (relevantLink) {
      return {
        type: 'send_link',
        contactId,
        conversationId,
        data: { 
          url: relevantLink,
          description: this.getLinkDescription(classification.intent)
        },
        automated: true
      };
    }

    return null;
  }

  /**
   * Programa follow-up automático
   */
  private async scheduleFollowup(
    contactId: number,
    conversationId: number,
    classification: any
  ): Promise<CRMAction | null> {
    try {
      const followupTime = this.calculateFollowupTime(classification);
      
      return {
        type: 'schedule_followup',
        contactId,
        conversationId,
        data: {
          scheduledFor: followupTime,
          type: 'automated',
          message: this.generateFollowupMessage(classification),
          priority: classification.urgency
        },
        automated: true
      };

    } catch (error) {
      console.error('❌ Erro ao programar follow-up:', error);
      return null;
    }
  }

  /**
   * Transfere para equipe especializada
   */
  private async transferToTeam(
    team: string,
    contactId: number,
    conversationId: number
  ): Promise<CRMAction | null> {
    try {
      // Atualizar conversa com a equipe sugerida
      await db
        .update(conversations)
        .set({
          priority: 'high',
          updatedAt: new Date(),
          metadata: { assignedTeam: team }
        })
        .where(eq(conversations.id, conversationId));

      return {
        type: 'transfer_team',
        contactId,
        conversationId,
        data: {
          team: team,
          reason: 'Alto nível de complexidade ou frustração detectado',
          automated: true
        },
        automated: true
      };

    } catch (error) {
      console.error('❌ Erro ao transferir para equipe:', error);
      return null;
    }
  }

  // Métodos auxiliares
  private extractCourseInterest(message: string, keywords: string[]): string {
    const courses = [
      'neuropsicopedagogia', 'psicopedagogia', 'educacao especial',
      'gestao escolar', 'pedagogia', 'psicologia', 'libras'
    ];

    const messageLower = message.toLowerCase();
    for (const course of courses) {
      if (messageLower.includes(course) || keywords.some((k: string) => k.includes(course))) {
        return course;
      }
    }

    return 'curso-geral';
  }

  private determineFunnelStage(classification: any): string {
    if (classification.intent === 'course_inquiry') {
      if (classification.sentiment === 'excited') return 'interesse-alto';
      if (classification.contextKeywords.some(k => k.includes('valor') || k.includes('preco'))) {
        return 'negociacao';
      }
      return 'interesse-inicial';
    }
    
    if (classification.isStudent) return 'cliente';
    
    return 'lead-frio';
  }

  private estimateDealValue(courseInterest: string): number {
    const courseValues: { [key: string]: number } = {
      'neuropsicopedagogia': 2500,
      'psicopedagogia': 2200,
      'educacao-especial': 2000,
      'gestao-escolar': 1800,
      'curso-geral': 2000
    };

    return courseValues[courseInterest] || 2000;
  }

  private assessLeadQuality(classification: any): 'low' | 'medium' | 'high' {
    if (classification.confidence >= 80 && classification.sentiment === 'excited') {
      return 'high';
    }
    if (classification.confidence >= 60 && classification.isLead) {
      return 'medium';
    }
    return 'low';
  }

  private getLinkDescription(intent: string): string {
    const descriptions: { [key: string]: string } = {
      'course_inquiry': 'Catálogo completo de cursos disponíveis',
      'student_support': 'Portal do aluno - Acesso aos materiais',
      'financial': 'Segunda via de boletos e informações financeiras',
      'lead_generation': 'Formulário de matrícula com desconto especial'
    };

    return descriptions[intent] || 'Link útil para sua solicitação';
  }

  private calculateFollowupTime(classification: any): Date {
    const now = new Date();
    let hoursToAdd = 24; // Padrão: 1 dia

    if (classification.urgency === 'high') hoursToAdd = 4;
    else if (classification.urgency === 'medium') hoursToAdd = 12;
    else if (classification.sentiment === 'excited') hoursToAdd = 6;

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  private generateFollowupMessage(classification: any): string {
    if (classification.isLead) {
      return `Olá! Sou a Prof. Ana 😊 Vi que você demonstrou interesse em nossos cursos. Gostaria de saber mais detalhes ou tirar alguma dúvida?`;
    }
    
    if (classification.isStudent) {
      return `Oi! Como está seus estudos? Precisa de algum apoio ou tem dúvidas sobre o material? Estou aqui para ajudar! 💜`;
    }

    return `Olá! Passando para ver se conseguiu resolver sua questão. Caso precise de mais informações, é só me chamar! 😊`;
  }
}

export const crmService = new CRMService();