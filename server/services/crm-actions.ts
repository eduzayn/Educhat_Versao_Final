import { db } from '../core/db';
import { contacts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { CRMAction } from './crm-types';

export async function executeAutomatedActions(
  classification: any,
  contactId: number,
  conversationId: number,
  message: string
): Promise<CRMAction[]> {
  const actions: CRMAction[] = [];
  try {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId));
    if (!contact) {
      console.warn(`⚠️ Contato ${contactId} não encontrado`);
      return actions;
    }
    const tagAction = await addAutomaticTags(contact, classification);
    if (tagAction) actions.push(tagAction);
  } catch (error) {
    console.error('❌ Erro ao executar ações automáticas CRM:', error);
  }
  return actions;
}

export async function addAutomaticTags(
  contact: any,
  classification: any
): Promise<CRMAction | null> {
  try {
    const newTags: string[] = [];
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
    if (classification.sentiment === 'excited') {
      newTags.push('muito-interessado');
    } else if (classification.sentiment === 'frustrated') {
      newTags.push('frustrado');
    }
    if (classification.userProfile.type === 'lead') {
      newTags.push(`lead-${classification.userProfile.stage}`);
    }
    if (classification.urgency === 'high' || classification.urgency === 'critical') {
      newTags.push('alta-prioridade');
    }
    if (newTags.length > 0) {
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