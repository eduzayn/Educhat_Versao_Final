import { db } from '../core/db';
import { aiContext, aiSessions } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { MessageClassification } from './ai-types';

export class AIContext {
  /**
   * Salva contexto da conversa
   */
  async saveContext(data: {
    conversationId: number;
    contactId: number;
    contextType: 'session' | 'conversation' | 'user';
    key: string;
    value: any;
    expiresAt?: Date;
  }): Promise<void> {
    try {
      await db.insert(aiContext).values({
        conversationId: data.conversationId,
        contactId: data.contactId,
        contextType: data.contextType,
        key: data.key,
        value: JSON.stringify(data.value),
        expiresAt: data.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar contexto:', error);
    }
  }

  /**
   * Busca contexto da conversa
   */
  async getContext(
    conversationId: number,
    contactId?: number,
    contextType?: 'session' | 'conversation' | 'user'
  ): Promise<any> {
    try {
      const whereConditions = [eq(aiContext.isActive, true)];
      
      if (conversationId) {
        whereConditions.push(eq(aiContext.conversationId, conversationId));
      }
      
      if (contactId) {
        whereConditions.push(eq(aiContext.contactId, contactId));
      }

      if (contextType) {
        whereConditions.push(eq(aiContext.contextType, contextType));
      }

      const contexts = await db.select()
        .from(aiContext)
        .where(and(...whereConditions))
        .orderBy(desc(aiContext.updatedAt));

      // Converter valores JSON de volta para objetos
      return contexts.map(c => ({
        ...c,
        value: JSON.parse(c.value)
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar contexto:', error);
      return [];
    }
  }

  /**
   * Atualiza contexto existente
   */
  async updateContext(
    contextId: number,
    value: any,
    expiresAt?: Date
  ): Promise<void> {
    try {
      await db.update(aiContext)
        .set({
          value: JSON.stringify(value),
          expiresAt,
          updatedAt: new Date()
        })
        .where(eq(aiContext.id, contextId));
    } catch (error) {
      console.error('❌ Erro ao atualizar contexto:', error);
    }
  }

  /**
   * Desativa contexto
   */
  async deactivateContext(contextId: number): Promise<void> {
    try {
      await db.update(aiContext)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(aiContext.id, contextId));
    } catch (error) {
      console.error('❌ Erro ao desativar contexto:', error);
    }
  }

  /**
   * Limpa contextos expirados
   */
  async cleanupExpiredContexts(): Promise<void> {
    try {
      await db.update(aiContext)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiContext.isActive, true),
          eq(aiContext.expiresAt, new Date())
        ));
    } catch (error) {
      console.error('❌ Erro ao limpar contextos expirados:', error);
    }
  }

  /**
   * Inicia nova sessão de IA
   */
  async startSession(data: {
    conversationId: number;
    contactId: number;
    initialContext?: any;
  }): Promise<void> {
    try {
      // Desativar sessões anteriores
      await db.update(aiSessions)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiSessions.conversationId, data.conversationId),
          eq(aiSessions.isActive, true)
        ));

      // Criar nova sessão
      await db.insert(aiSessions).values({
        conversationId: data.conversationId,
        contactId: data.contactId,
        sessionData: data.initialContext || {},
        isActive: true,
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error);
    }
  }

  /**
   * Atualiza sessão ativa
   */
  async updateSession(
    conversationId: number,
    sessionData: any
  ): Promise<void> {
    try {
      await db.update(aiSessions)
        .set({
          sessionData,
          lastInteraction: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ));
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão:', error);
    }
  }

  /**
   * Finaliza sessão ativa
   */
  async endSession(conversationId: number): Promise<void> {
    try {
      await db.update(aiSessions)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ));
    } catch (error) {
      console.error('❌ Erro ao finalizar sessão:', error);
    }
  }

  /**
   * Busca sessão ativa
   */
  async getActiveSession(conversationId: number): Promise<any> {
    try {
      const [session] = await db.select()
        .from(aiSessions)
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ))
        .orderBy(desc(aiSessions.lastInteraction))
        .limit(1);

      return session;
    } catch (error) {
      console.error('❌ Erro ao buscar sessão ativa:', error);
      return null;
    }
  }

  /**
   * Formata contexto para uso em prompt
   */
  formatContextForPrompt(contexts: any[]): string {
    if (!contexts || contexts.length === 0) {
      return '';
    }

    const categorizedContexts = {
      session: contexts.filter(c => c.contextType === 'session'),
      conversation: contexts.filter(c => c.contextType === 'conversation'),
      user: contexts.filter(c => c.contextType === 'user')
    };

    let contextString = '\n=== CONTEXTO DA CONVERSA ===\n';
    
    if (categorizedContexts.session.length > 0) {
      contextString += '\nDados da sessão:\n';
      categorizedContexts.session.forEach(c => {
        contextString += `- ${c.key}: ${JSON.stringify(c.value)}\n`;
      });
    }

    if (categorizedContexts.conversation.length > 0) {
      contextString += '\nContexto da conversa:\n';
      categorizedContexts.conversation.forEach(c => {
        contextString += `- ${c.key}: ${JSON.stringify(c.value)}\n`;
      });
    }

    if (categorizedContexts.user.length > 0) {
      contextString += '\nInformações do usuário:\n';
      categorizedContexts.user.forEach(c => {
        contextString += `- ${c.key}: ${JSON.stringify(c.value)}\n`;
      });
    }

    contextString += '=== FIM DO CONTEXTO ===\n';
    return contextString;
  }
} 