/**
 * Serviço para cache inteligente de avatares
 * Integra com Z-API e evita requisições repetidas do Gravatar
 */

import { db } from '../db';
import { contacts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { getContactPhoto } from '../utils/zapi';

interface AvatarCacheResult {
  avatarUrl: string | null;
  source: 'cache' | 'zapi' | 'fallback';
  cached: boolean;
}

export class AvatarCacheService {
  private static readonly CACHE_EXPIRY_HOURS = 24;
  private static readonly MAX_FETCH_ATTEMPTS = 3;

  /**
   * Obtém avatar com cache inteligente
   */
  static async getContactAvatar(contactId: number, phone?: string): Promise<AvatarCacheResult> {
    try {
      // Buscar dados atuais do contato
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);

      if (!contact) {
        return { avatarUrl: null, source: 'fallback', cached: false };
      }

      // Verificar se há cache válido
      if (this.isCacheValid(contact)) {
        return {
          avatarUrl: contact.avatarCacheUrl,
          source: 'cache',
          cached: true
        };
      }

      // Verificar se deve tentar buscar novamente
      if (this.shouldSkipFetch(contact)) {
        return {
          avatarUrl: contact.avatarCacheUrl || null,
          source: 'fallback',
          cached: true
        };
      }

      // Tentar buscar via Z-API
      const phoneNumber = phone || contact.phone;
      if (phoneNumber) {
        const zapiAvatar = await this.fetchFromZApi(phoneNumber);
        if (zapiAvatar) {
          await this.updateContactCache(contactId, zapiAvatar, true);
          return {
            avatarUrl: zapiAvatar,
            source: 'zapi',
            cached: false
          };
        }
      }

      // Falha ao buscar - atualizar tentativas
      await this.updateFailedAttempt(contactId);
      
      return {
        avatarUrl: contact.avatarCacheUrl || null,
        source: 'fallback',
        cached: true
      };

    } catch (error) {
      console.error('❌ Erro no cache de avatar:', error);
      return { avatarUrl: null, source: 'fallback', cached: false };
    }
  }

  /**
   * Verifica se o cache é válido
   */
  private static isCacheValid(contact: any): boolean {
    if (!contact.hasValidAvatar || !contact.avatarLastFetch) {
      return false;
    }

    const now = new Date();
    const lastFetch = new Date(contact.avatarLastFetch);
    const hoursDiff = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

    return hoursDiff < this.CACHE_EXPIRY_HOURS;
  }

  /**
   * Verifica se deve pular tentativa de busca
   */
  private static shouldSkipFetch(contact: any): boolean {
    return (contact.avatarFetchAttempts || 0) >= this.MAX_FETCH_ATTEMPTS;
  }

  /**
   * Busca avatar via Z-API
   */
  private static async fetchFromZApi(phone: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando avatar via Z-API para ${phone}`);
      const avatarUrl = await getContactPhoto(phone);
      
      if (avatarUrl) {
        console.log(`✅ Avatar encontrado via Z-API para ${phone}`);
        return avatarUrl;
      }
      
      console.log(`⚠️ Avatar não encontrado via Z-API para ${phone}`);
      return null;
    } catch (error) {
      console.error(`❌ Erro ao buscar avatar via Z-API para ${phone}:`, error);
      return null;
    }
  }

  /**
   * Atualiza cache do contato com sucesso
   */
  private static async updateContactCache(
    contactId: number, 
    avatarUrl: string, 
    isValid: boolean
  ): Promise<void> {
    await db
      .update(contacts)
      .set({
        avatarCacheUrl: avatarUrl,
        avatarLastFetch: new Date(),
        avatarFetchAttempts: 0,
        hasValidAvatar: isValid,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, contactId));

    console.log(`💾 Cache de avatar atualizado para contato ${contactId}`);
  }

  /**
   * Atualiza tentativa falhada
   */
  private static async updateFailedAttempt(contactId: number): Promise<void> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (contact) {
      await db
        .update(contacts)
        .set({
          avatarLastFetch: new Date(),
          avatarFetchAttempts: (contact.avatarFetchAttempts || 0) + 1,
          hasValidAvatar: false,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, contactId));

      console.log(`🔄 Tentativa de avatar falhada para contato ${contactId} (${(contact.avatarFetchAttempts || 0) + 1}/${this.MAX_FETCH_ATTEMPTS})`);
    }
  }

  /**
   * Limpa cache expirado de todos os contatos
   */
  static async cleanExpiredCache(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.CACHE_EXPIRY_HOURS);

      const result = await db
        .update(contacts)
        .set({
          hasValidAvatar: false,
          avatarFetchAttempts: 0
        })
        .where(eq(contacts.avatarLastFetch, cutoffDate));

      console.log('🧹 Cache de avatares expirado limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache expirado:', error);
    }
  }

  /**
   * Força atualização de avatar para um contato específico
   */
  static async forceRefreshAvatar(contactId: number, phone?: string): Promise<AvatarCacheResult> {
    try {
      // Reset cache
      await db
        .update(contacts)
        .set({
          avatarFetchAttempts: 0,
          hasValidAvatar: false,
          avatarLastFetch: null
        })
        .where(eq(contacts.id, contactId));

      // Buscar novamente
      return await this.getContactAvatar(contactId, phone);
    } catch (error) {
      console.error('❌ Erro ao forçar refresh de avatar:', error);
      return { avatarUrl: null, source: 'fallback', cached: false };
    }
  }
}