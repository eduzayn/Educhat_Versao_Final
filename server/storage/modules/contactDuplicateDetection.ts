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
   */
  async checkPhoneDuplicates(phone: string, excludeContactId?: number): Promise<ContactDuplicationResult> {
    if (!phone || !phone.trim()) {
      return {
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: []
      };
    }

    // Normalizar número de telefone (remover espaços, caracteres especiais, etc.)
    const normalizedPhone = this.normalizePhone(phone);

    // Buscar contatos com o mesmo número
    const whereConditions = [
      eq(contacts.phone, phone),
      eq(contacts.phone, normalizedPhone)
    ];

    // Se há variações do número, incluí-las na busca
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

    const duplicateContacts = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        phone: contacts.phone,
        canalOrigem: contacts.canalOrigem,
        nomeCanal: contacts.nomeCanal,
        idCanal: contacts.idCanal,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      })
      .from(contacts)
      .where(whereClause);

    if (duplicateContacts.length === 0) {
      return {
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: []
      };
    }

    // Buscar informações adicionais sobre conversas para cada contato duplicado
    const duplicatesWithInfo: DuplicateContactInfo[] = [];
    const channels: Set<string> = new Set();

    for (const contact of duplicateContacts) {
      // Contar conversas do contato
      const conversationCount = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(conversations)
        .where(eq(conversations.contactId, contact.id));

      // Buscar última atividade
      const lastConversation = await this.db
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
        conversationCount: conversationCount[0]?.count || 0,
        lastActivity: lastConversation[0]?.lastMessageAt || contact.createdAt
      });

      // Coletar canais únicos
      if (contact.canalOrigem) {
        channels.add(contact.canalOrigem);
      }
      if (contact.nomeCanal) {
        channels.add(contact.nomeCanal);
      }
    }

    return {
      isDuplicate: true,
      duplicates: duplicatesWithInfo,
      totalDuplicates: duplicatesWithInfo.length,
      channels: Array.from(channels)
    };
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

    // Filtrar apenas grupos com duplicados e adicionar informações de conversas
    const duplicateGroups: {[phone: string]: DuplicateContactInfo[]} = {};

    for (const [phone, contactGroup] of Object.entries(phoneGroups)) {
      if (contactGroup.length > 1) {
        const duplicatesWithInfo: DuplicateContactInfo[] = [];

        for (const contact of contactGroup) {
          // Contar conversas
          const conversationCount = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(conversations)
            .where(eq(conversations.contactId, contact.id));

          // Buscar última atividade
          const lastConversation = await this.db
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
            conversationCount: conversationCount[0]?.count || 0,
            lastActivity: lastConversation[0]?.lastMessageAt || contact.createdAt
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
    
    // Remover 9 adicional em celulares se presente
    if (normalized.length === 11 && normalized.substring(2, 3) === '9') {
      // Verificar se é um celular (DDD + 9 + 8 dígitos)
      const ddd = normalized.substring(0, 2);
      if (this.isValidDDD(ddd)) {
        return normalized; // Manter como está se for celular
      }
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
    
    // Formatos com símbolos comuns
    if (cleanPhone.length === 11) {
      const formatted = `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
      variations.push(formatted);
    }
    
    return variations;
  }

  /**
   * Verificar se é um DDD válido brasileiro
   */
  private isValidDDD(ddd: string): boolean {
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
      '21', '22', '24', // Rio de Janeiro
      '27', '28', // Espírito Santo
      '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
      '41', '42', '43', '44', '45', '46', // Paraná
      '47', '48', '49', // Santa Catarina
      '51', '53', '54', '55', // Rio Grande do Sul
      '61', // Distrito Federal
      '62', '64', // Goiás
      '63', // Tocantins
      '65', '66', // Mato Grosso
      '67', // Mato Grosso do Sul
      '68', // Acre
      '69', // Rondônia
      '71', '73', '74', '75', '77', // Bahia
      '79', // Sergipe
      '81', '87', // Pernambuco
      '82', // Alagoas
      '83', // Paraíba
      '84', // Rio Grande do Norte
      '85', '88', // Ceará
      '86', '89', // Piauí
      '91', '93', '94', // Pará
      '92', '97', // Amazonas
      '95', // Roraima
      '96', // Amapá
      '98', '99' // Maranhão
    ];
    
    return validDDDs.includes(ddd);
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