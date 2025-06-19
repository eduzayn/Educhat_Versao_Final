import { BaseStorage } from "../base/BaseStorage";
import { contacts, conversations, type Contact } from "@shared/schema";
import { eq, or, and, ne, sql } from "drizzle-orm";

export interface DuplicateContactInfo {
  contactId: number;
  name: string;
  phone: string | null;
  canalOrigem: string | null;
  nomeCanal: string | null;
  idCanal: string | null;
  conversationCount: number;
  lastActivity: Date | null;
}

export interface ContactDuplicationResult {
  isDuplicate: boolean;
  duplicates: DuplicateContactInfo[];
  totalDuplicates: number;
  channels: string[];
}

/**
 * Módulo para detecção e gerenciamento de contatos duplicados
 * Identifica contatos com mesmo número de telefone em canais diferentes
 */
export class ContactDuplicateDetection extends BaseStorage {
  
  /**
   * Verifica se um número de telefone já existe em outros canais
   * OTIMIZADO: Query única com JOIN para evitar múltiplas consultas
   */
  async checkPhoneDuplicates(phone: string, excludeContactId?: number): Promise<ContactDuplicationResult> {
    const startTime = Date.now();
    
    try {
      if (!phone || !phone.trim()) {
        return {
          isDuplicate: false,
          duplicates: [],
          totalDuplicates: 0,
          channels: []
        };
      }

      // Normalizar número de telefone
      const normalizedPhone = this.normalizePhone(phone);

      // Buscar contatos com o mesmo número usando query otimizada
      const whereConditions = [
        eq(contacts.phone, phone),
        eq(contacts.phone, normalizedPhone)
      ];

      // Gerar variações do número
      const phoneVariations = this.generatePhoneVariations(normalizedPhone);
      phoneVariations.forEach(variation => {
        whereConditions.push(eq(contacts.phone, variation));
      });

      let whereClause = or(...whereConditions);

      // Excluir o contato atual se especificado
      if (excludeContactId) {
        whereClause = and(
          or(...whereConditions),
          ne(contacts.id, excludeContactId)
        );
      }

      // Query otimizada com JOIN para buscar dados em uma única consulta
      const foundContactsWithStats = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
          conversationCount: sql<number>`COALESCE(COUNT(${conversations.id}), 0)`,
          lastActivity: sql<Date>`COALESCE(MAX(${conversations.lastMessageAt}), ${contacts.createdAt})`
        })
        .from(contacts)
        .leftJoin(conversations, eq(conversations.contactId, contacts.id))
        .where(whereClause)
        .groupBy(
          contacts.id, 
          contacts.name, 
          contacts.phone, 
          contacts.canalOrigem, 
          contacts.nomeCanal, 
          contacts.idCanal, 
          contacts.createdAt, 
          contacts.updatedAt
        )
        .limit(50); // Limitar para evitar sobrecarga

      const duration = Date.now() - startTime;

      if (foundContactsWithStats.length === 0) {
        console.log(`✅ Verificação de duplicatas concluída em ${duration}ms - Nenhuma duplicata encontrada`);
        return {
          isDuplicate: false,
          duplicates: [],
          totalDuplicates: 0,
          channels: []
        };
      }

      // Processar informações otimizadas
      const duplicatesWithInfo: DuplicateContactInfo[] = [];
      const channels: Set<string> = new Set();

      for (const contact of foundContactsWithStats) {
        duplicatesWithInfo.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          canalOrigem: contact.canalOrigem,
          nomeCanal: contact.nomeCanal,
          idCanal: contact.idCanal,
          conversationCount: contact.conversationCount || 0,
          lastActivity: contact.lastActivity || contact.createdAt
        });

        // Coletar canais únicos
        if (contact.canalOrigem) {
          channels.add(contact.canalOrigem);
        }
        if (contact.nomeCanal) {
          channels.add(contact.nomeCanal);
        }
      }

      console.log(`✅ Verificação de duplicatas concluída em ${duration}ms - ${duplicatesWithInfo.length} duplicatas encontradas`);

      return {
        isDuplicate: true,
        duplicates: duplicatesWithInfo,
        totalDuplicates: duplicatesWithInfo.length,
        channels: Array.from(channels)
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro na verificação de duplicatas (${duration}ms):`, error);
      
      // Retornar resultado padrão em caso de erro para evitar 502
      return {
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: []
      };
    }
  }

  /**
   * Buscar todos os contatos duplicados no sistema
   */
  async findAllDuplicateContacts(): Promise<{[phone: string]: DuplicateContactInfo[]}> {
    // Buscar todos os contatos com números de telefone válidos
    const contactsWithPhones = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        phone: contacts.phone,
        canalOrigem: contacts.canalOrigem,
        nomeCanal: contacts.nomeCanal,
        idCanal: contacts.idCanal,
        createdAt: contacts.createdAt
      })
      .from(contacts)
      .where(sql`${contacts.phone} IS NOT NULL AND ${contacts.phone} != ''`);

    // Agrupar por número de telefone normalizado
    const phoneGroups: {[phone: string]: typeof contactsWithPhones} = {};

    for (const contact of contactsWithPhones) {
      if (!contact.phone) continue;
      
      const normalizedPhone = this.normalizePhone(contact.phone);
      if (!phoneGroups[normalizedPhone]) {
        phoneGroups[normalizedPhone] = [];
      }
      phoneGroups[normalizedPhone].push(contact);
    }

    // Filtrar apenas grupos com duplicados
    const duplicateGroups: {[phone: string]: DuplicateContactInfo[]} = {};

    for (const [phone, contactGroup] of Object.entries(phoneGroups)) {
      if (contactGroup.length > 1) {
        const duplicatesWithInfo: DuplicateContactInfo[] = [];

        for (const contact of contactGroup) {
          // Contar conversas
          const [countResult] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(conversations)
            .where(eq(conversations.contactId, contact.id));

          // Buscar última atividade
          const [lastConversation] = await this.db
            .select({ lastMessageAt: conversations.lastMessageAt })
            .from(conversations)
            .where(eq(conversations.contactId, contact.id))
            .orderBy(sql`${conversations.lastMessageAt} DESC`)
            .limit(1);

          duplicatesWithInfo.push({
            contactId: contact.id,
            name: contact.name,
            phone: contact.phone,
            canalOrigem: contact.canalOrigem,
            nomeCanal: contact.nomeCanal,
            idCanal: contact.idCanal,
            conversationCount: countResult?.count || 0,
            lastActivity: lastConversation?.lastMessageAt || contact.createdAt
          });
        }

        duplicateGroups[phone] = duplicatesWithInfo;
      }
    }

    return duplicateGroups;
  }

  /**
   * Normalizar número de telefone para comparação
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    
    // Remover caracteres não numéricos
    let normalized = phone.replace(/\D/g, '');
    
    // Remover código do país Brasil se presente
    if (normalized.startsWith('55') && normalized.length === 13) {
      normalized = normalized.substring(2);
    }
    
    return normalized;
  }

  /**
   * Gerar variações do número de telefone para busca
   */
  private generatePhoneVariations(phone: string): string[] {
    const variations: string[] = [];
    
    if (!phone) return variations;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Variação com código do país
    if (cleanPhone.length === 11) {
      variations.push(`55${cleanPhone}`);
    }
    
    // Variação sem o 9 do celular
    if (cleanPhone.length === 11 && cleanPhone.substring(2, 3) === '9') {
      const withoutNine = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
      variations.push(withoutNine);
      variations.push(`55${withoutNine}`);
    }
    
    // Variação com o 9 do celular
    if (cleanPhone.length === 10) {
      const withNine = cleanPhone.substring(0, 2) + '9' + cleanPhone.substring(2);
      variations.push(withNine);
      variations.push(`55${withNine}`);
    }
    
    return variations;
  }

  /**
   * Verificar duplicatas antes de criar um novo contato
   */
  async checkBeforeCreate(contactData: { phone?: string | null, userIdentity?: string | null }): Promise<ContactDuplicationResult> {
    if (!contactData.phone) {
      return {
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: []
      };
    }

    return this.checkPhoneDuplicates(contactData.phone);
  }
}