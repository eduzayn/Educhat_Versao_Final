import { db } from '../core/db';
import { contacts } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface CRMAction {
  type: 'add_tag' | 'update_contact' | 'log_activity';
  contactId: number;
  conversationId: number;
  data: any;
  automated: boolean;
}

/**
 * Serviço CRM - Responsabilidade única: gestão de contatos e tags
 * Lógicas de deals e funis movidas para serviços específicos
 */
export class CRMService {

  /**
   * Executa ações CRM baseadas na classificação da IA
   * Responsabilidade: Apenas tags e atualizações de contato
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

      // Ação: Adicionar tags automáticas baseadas na classificação
      const tagAction = await this.addAutomaticTags(contact, classification);
      if (tagAction) actions.push(tagAction);

      // Ação: Atualizar informações do contato se necessário
      const updateAction = await this.updateContactInfo(contact, classification);
      if (updateAction) actions.push(updateAction);

    } catch (error) {
      console.error('❌ Erro ao executar ações automáticas CRM:', error);
    }

    return actions;
  }

  /**
   * Adiciona tags automáticas baseadas na classificação
   * Responsabilidade: Gestão inteligente de tags
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
        case 'technical_support':
          newTags.push('suporte-tecnico');
          break;
        case 'enrollment':
          newTags.push('processo-matricula');
          break;
      }

      // Tags baseadas no sentimento
      if (classification.sentiment === 'excited') {
        newTags.push('muito-interessado');
      } else if (classification.sentiment === 'frustrated') {
        newTags.push('frustrado');
      } else if (classification.sentiment === 'satisfied') {
        newTags.push('satisfeito');
      }

      // Tags baseadas no perfil
      if (classification.userProfile?.type === 'lead') {
        newTags.push(`lead-${classification.userProfile.stage}`);
      } else if (classification.userProfile?.type === 'student') {
        newTags.push('aluno-ativo');
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
   * Atualiza informações do contato baseadas na classificação
   * Responsabilidade: Enriquecimento de dados do contato
   */
  private async updateContactInfo(
    contact: any,
    classification: any
  ): Promise<CRMAction | null> {
    try {
      const updates: any = {};
      let hasUpdates = false;

      // Atualizar curso de interesse se detectado
      if (classification.courseInterest && classification.courseInterest !== contact.courseInterest) {
        updates.courseInterest = classification.courseInterest;
        hasUpdates = true;
      }

      // Atualizar prioridade baseada na urgência
      if (classification.urgency === 'critical' && contact.priority !== 'high') {
        updates.priority = 'high';
        hasUpdates = true;
      }

      // Atualizar status baseado no perfil
      if (classification.userProfile?.type && classification.userProfile.type !== contact.status) {
        updates.status = classification.userProfile.type;
        hasUpdates = true;
      }

      if (hasUpdates) {
        updates.updatedAt = new Date();

        await db
          .update(contacts)
          .set(updates)
          .where(eq(contacts.id, contact.id));

        return {
          type: 'update_contact',
          contactId: contact.id,
          conversationId: 0,
          data: updates,
          automated: true
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erro ao atualizar informações do contato:', error);
      return null;
    }
  }

  /**
   * Registra atividade CRM
   * Responsabilidade: Log de atividades automatizadas
   */
  async logActivity(contactId: number, action: string, details: any): Promise<void> {
    try {
      console.log(`📝 Atividade CRM registrada: Contato ${contactId} - ${action}`, details);
      // Implementar log de atividades se necessário
    } catch (error) {
      console.error('❌ Erro ao registrar atividade CRM:', error);
    }
  }
}

export const crmService = new CRMService();