import { eq, and, desc, sql } from "drizzle-orm";
import { BaseStorage } from "../base/BaseStorage";
import { userTags, contactUserTags, type UserTag, type InsertUserTag, type ContactUserTag, type InsertContactUserTag } from "../../../shared/schema";

export class UserTagStorage extends BaseStorage {
  
  // Criar nova tag de usuário
  async createUserTag(tagData: InsertUserTag): Promise<UserTag> {
    const [newTag] = await this.db
      .insert(userTags)
      .values(tagData)
      .returning();
    
    return newTag;
  }

  // Buscar todas as tags de um usuário específico
  async getUserTags(userId: number): Promise<UserTag[]> {
    return await this.db
      .select()
      .from(userTags)
      .where(eq(userTags.createdBy, userId))
      .orderBy(desc(userTags.createdAt));
  }

  // Buscar tag por ID
  async getUserTagById(tagId: number): Promise<UserTag | null> {
    const [tag] = await this.db
      .select()
      .from(userTags)
      .where(eq(userTags.id, tagId))
      .limit(1);
    
    return tag || null;
  }

  // Atualizar tag existente
  async updateUserTag(tagId: number, userId: number, updates: Partial<InsertUserTag>): Promise<UserTag | null> {
    const [updatedTag] = await this.db
      .update(userTags)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(userTags.id, tagId),
        eq(userTags.createdBy, userId) // Apenas criador pode editar
      ))
      .returning();
    
    return updatedTag || null;
  }

  // Deletar tag (apenas se não estiver sendo usada)
  async deleteUserTag(tagId: number, userId: number): Promise<boolean> {
    // Verificar se a tag está sendo usada
    const [usage] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(contactUserTags)
      .where(eq(contactUserTags.tagId, tagId));

    if (usage.count > 0) {
      throw new Error('Tag não pode ser deletada pois está sendo usada em contatos');
    }

    const result = await this.db
      .delete(userTags)
      .where(and(
        eq(userTags.id, tagId),
        eq(userTags.createdBy, userId) // Apenas criador pode deletar
      ));

    return (result.rowCount || 0) > 0;
  }

  // Aplicar tag a um contato
  async addTagToContact(contactId: number, tagId: number): Promise<ContactUserTag> {
    // Verificar se a associação já existe
    const [existing] = await this.db
      .select()
      .from(contactUserTags)
      .where(and(
        eq(contactUserTags.contactId, contactId),
        eq(contactUserTags.tagId, tagId)
      ))
      .limit(1);

    if (existing) {
      return existing; // Retorna a associação existente
    }

    const [newAssociation] = await this.db
      .insert(contactUserTags)
      .values({
        contactId,
        tagId
      })
      .returning();

    return newAssociation;
  }

  // Remover tag de um contato
  async removeTagFromContact(contactId: number, tagId: number): Promise<boolean> {
    const result = await this.db
      .delete(contactUserTags)
      .where(and(
        eq(contactUserTags.contactId, contactId),
        eq(contactUserTags.tagId, tagId)
      ));

    return (result.rowCount || 0) > 0;
  }

  // Buscar tags de um contato específico
  async getContactTags(contactId: number): Promise<UserTag[]> {
    return await this.db
      .select({
        id: userTags.id,
        name: userTags.name,
        color: userTags.color,
        createdBy: userTags.createdBy,
        createdAt: userTags.createdAt,
        updatedAt: userTags.updatedAt
      })
      .from(contactUserTags)
      .innerJoin(userTags, eq(contactUserTags.tagId, userTags.id))
      .where(eq(contactUserTags.contactId, contactId))
      .orderBy(userTags.name);
  }

  // Buscar contatos que possuem uma tag específica
  async getContactsByTag(tagId: number): Promise<number[]> {
    const results = await this.db
      .select({ contactId: contactUserTags.contactId })
      .from(contactUserTags)
      .where(eq(contactUserTags.tagId, tagId));

    return results.map(r => r.contactId);
  }

  // Buscar contatos que possuem qualquer uma das tags especificadas
  async getContactsByTags(tagIds: number[]): Promise<number[]> {
    if (tagIds.length === 0) return [];

    const results = await this.db
      .select({ contactId: contactUserTags.contactId })
      .from(contactUserTags)
      .where(sql`${contactUserTags.tagId} = ANY(${tagIds})`)
      .groupBy(contactUserTags.contactId);

    return results.map(r => r.contactId);
  }

  // Buscar estatísticas de uso das tags de um usuário
  async getUserTagStats(userId: number): Promise<Array<{tag: UserTag, usageCount: number}>> {
    const results = await this.db
      .select({
        tag: userTags,
        usageCount: sql<number>`count(${contactUserTags.contactId})`
      })
      .from(userTags)
      .leftJoin(contactUserTags, eq(userTags.id, contactUserTags.tagId))
      .where(eq(userTags.createdBy, userId))
      .groupBy(userTags.id, userTags.name, userTags.color, userTags.createdBy, userTags.createdAt, userTags.updatedAt)
      .orderBy(desc(sql`count(${contactUserTags.contactId})`));

    return results;
  }
}