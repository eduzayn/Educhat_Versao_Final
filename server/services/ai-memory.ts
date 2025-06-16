import { db } from '../core/db';
import { aiMemory } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { MessageClassification } from './ai-types';

export class AIMemory {
  /**
   * Salva informação na memória contextual
   */
  async saveToMemory(data: {
    conversationId: number;
    contactId: number;
    key: string;
    value: string;
    memoryType: 'user_info' | 'preferences' | 'context' | 'history';
    importance?: number;
    expiresAt?: Date;
  }): Promise<void> {
    try {
      await db.insert(aiMemory).values({
        conversationId: data.conversationId,
        contactId: data.contactId,
        key: data.key,
        value: data.value,
        memoryType: data.memoryType,
        importance: data.importance || 1,
        expiresAt: data.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar na memória:', error);
    }
  }

  /**
   * Extrai e salva memórias importantes da mensagem
   */
  async extractAndSaveMemories(
    message: string,
    classification: MessageClassification,
    conversationId: number,
    contactId: number
  ): Promise<void> {
    try {
      // Salvar informações do perfil
      await this.saveToMemory({
        conversationId,
        contactId,
        key: 'user_type',
        value: classification.userProfile.type,
        memoryType: 'user_info',
        importance: 3
      });

      await this.saveToMemory({
        conversationId,
        contactId,
        key: 'user_stage',
        value: classification.userProfile.stage,
        memoryType: 'user_info',
        importance: 3
      });

      // Salvar interesses
      if (classification.userProfile.interests.length > 0) {
        await this.saveToMemory({
          conversationId,
          contactId,
          key: 'interests',
          value: JSON.stringify(classification.userProfile.interests),
          memoryType: 'preferences',
          importance: 2
        });
      }

      // Salvar palavras-chave do contexto
      if (classification.contextKeywords.length > 0) {
        await this.saveToMemory({
          conversationId,
          contactId,
          key: 'context_keywords',
          value: JSON.stringify(classification.contextKeywords),
          memoryType: 'context',
          importance: 1
        });
      }

      // Salvar sentimento e nível de frustração
      await this.saveToMemory({
        conversationId,
        contactId,
        key: 'sentiment',
        value: classification.sentiment,
        memoryType: 'context',
        importance: 2
      });

      await this.saveToMemory({
        conversationId,
        contactId,
        key: 'frustration_level',
        value: classification.frustrationLevel.toString(),
        memoryType: 'context',
        importance: 2
      });

      // Salvar mensagem no histórico
      await this.saveToMemory({
        conversationId,
        contactId,
        key: 'last_message',
        value: message,
        memoryType: 'history',
        importance: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira em 24h
      });

    } catch (error) {
      console.error('❌ Erro ao extrair memórias:', error);
    }
  }

  /**
   * Busca memória contextual
   */
  async getContextualMemory(
    conversationId: number,
    contactId?: number,
    memoryType?: 'user_info' | 'preferences' | 'context' | 'history'
  ): Promise<any[]> {
    try {
      const whereConditions = [eq(aiMemory.isActive, true)];
      
      if (conversationId) {
        whereConditions.push(eq(aiMemory.conversationId, conversationId));
      }
      
      if (contactId) {
        whereConditions.push(eq(aiMemory.contactId, contactId));
      }

      if (memoryType) {
        whereConditions.push(eq(aiMemory.memoryType, memoryType));
      }

      const memories = await db.select()
        .from(aiMemory)
        .where(and(...whereConditions))
        .orderBy(desc(aiMemory.importance), desc(aiMemory.updatedAt))
        .limit(50);

      return memories;
    } catch (error) {
      console.error('❌ Erro ao buscar memória contextual:', error);
      return [];
    }
  }

  /**
   * Atualiza valor de uma memória
   */
  async updateMemory(
    memoryId: number,
    value: string,
    importance?: number
  ): Promise<void> {
    try {
      await db.update(aiMemory)
        .set({
          value,
          importance: importance || 1,
          updatedAt: new Date()
        })
        .where(eq(aiMemory.id, memoryId));
    } catch (error) {
      console.error('❌ Erro ao atualizar memória:', error);
    }
  }

  /**
   * Desativa memória
   */
  async deactivateMemory(memoryId: number): Promise<void> {
    try {
      await db.update(aiMemory)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(aiMemory.id, memoryId));
    } catch (error) {
      console.error('❌ Erro ao desativar memória:', error);
    }
  }

  /**
   * Limpa memórias expiradas
   */
  async cleanupExpiredMemories(): Promise<void> {
    try {
      await db.update(aiMemory)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiMemory.isActive, true),
          eq(aiMemory.expiresAt, new Date())
        ));
    } catch (error) {
      console.error('❌ Erro ao limpar memórias expiradas:', error);
    }
  }

  /**
   * Formata memórias para uso em prompt
   */
  formatMemoriesForPrompt(memories: any[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const categorizedMemories = {
      user_info: memories.filter(m => m.memoryType === 'user_info'),
      preferences: memories.filter(m => m.memoryType === 'preferences'),
      context: memories.filter(m => m.memoryType === 'context'),
      history: memories.filter(m => m.memoryType === 'history')
    };

    let contextString = '\n=== MEMÓRIA CONTEXTUAL ===\n';
    
    if (categorizedMemories.user_info.length > 0) {
      contextString += '\nInformações do usuário:\n';
      categorizedMemories.user_info.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.preferences.length > 0) {
      contextString += '\nPreferências:\n';
      categorizedMemories.preferences.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.context.length > 0) {
      contextString += '\nContexto da conversa:\n';
      categorizedMemories.context.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.history.length > 0) {
      contextString += '\nHistórico relevante:\n';
      categorizedMemories.history.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    contextString += '=== FIM DA MEMÓRIA ===\n';
    return contextString;
  }
} 