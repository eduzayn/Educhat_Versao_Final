import { eq, and, desc, ne } from "drizzle-orm";
import { db } from "../../db.js";
import { keywordRouting } from "../../../shared/schema";
import type { KeywordRouting, InsertKeywordRouting } from "../../../shared/schema";
import { BaseStorage } from "../base/BaseStorage";

export class KeywordRoutingStorage extends BaseStorage {
  /**
   * Busca todas as configurações de palavra-chave
   */
  async getKeywordRoutings(): Promise<KeywordRouting[]> {
    try {
      return await db
        .select()
        .from(keywordRouting)
        .orderBy(desc(keywordRouting.createdAt));
    } catch (error) {
      console.error("Erro ao buscar configurações de palavra-chave:", error);
      throw error;
    }
  }

  /**
   * Busca configuração por ID
   */
  async getKeywordRouting(id: number): Promise<KeywordRouting | undefined> {
    try {
      const result = await db
        .select()
        .from(keywordRouting)
        .where(eq(keywordRouting.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Erro ao buscar configuração por ID:", error);
      throw error;
    }
  }

  /**
   * Cria nova configuração de palavra-chave
   */
  async createKeywordRouting(data: InsertKeywordRouting): Promise<KeywordRouting> {
    try {
      const result = await db
        .insert(keywordRouting)
        .values({
          ...data,
          keyword: data.keyword.toLowerCase().trim(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Erro ao criar configuração de palavra-chave:", error);
      throw error;
    }
  }

  /**
   * Atualiza configuração existente
   */
  async updateKeywordRouting(id: number, data: Partial<InsertKeywordRouting>): Promise<KeywordRouting> {
    try {
      const updateData = { ...data };
      if (updateData.keyword) {
        updateData.keyword = updateData.keyword.toLowerCase().trim();
      }

      const result = await db
        .update(keywordRouting)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(keywordRouting.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      throw error;
    }
  }

  /**
   * Remove configuração
   */
  async deleteKeywordRouting(id: number): Promise<void> {
    try {
      await db
        .delete(keywordRouting)
        .where(eq(keywordRouting.id, id));
    } catch (error) {
      console.error("Erro ao deletar configuração:", error);
      throw error;
    }
  }

  /**
   * Busca equipe com base na mensagem
   */
  async findTeamByMessage(message: string): Promise<number | null> {
    try {
      const normalizedMessage = message.toLowerCase().trim();
      
      const results = await db
        .select({
          teamId: keywordRouting.teamId,
          keyword: keywordRouting.keyword,
        })
        .from(keywordRouting)
        .where(eq(keywordRouting.isActive, true));

      // Procura por matches exatos primeiro
      for (const config of results) {
        if (normalizedMessage.includes(config.keyword.toLowerCase())) {
          console.log(`🎯 Palavra-chave encontrada: "${config.keyword}" -> Team ${config.teamId}`);
          return config.teamId;
        }
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar equipe por mensagem:", error);
      return null;
    }
  }

  /**
   * Busca configurações por equipe
   */
  async getKeywordRoutingsByTeam(teamId: number): Promise<KeywordRouting[]> {
    try {
      return await db
        .select()
        .from(keywordRouting)
        .where(eq(keywordRouting.teamId, teamId))
        .orderBy(desc(keywordRouting.createdAt));
    } catch (error) {
      console.error("Erro ao buscar configurações por equipe:", error);
      throw error;
    }
  }

  /**
   * Verifica se palavra-chave já existe
   */
  async keywordExists(keyword: string, excludeId?: number): Promise<boolean> {
    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      
      let query = db
        .select({ id: keywordRouting.id })
        .from(keywordRouting)
        .where(eq(keywordRouting.keyword, normalizedKeyword));

      if (excludeId) {
        query = query.where(and(
          eq(keywordRouting.keyword, normalizedKeyword),
          ne(keywordRouting.id, excludeId)
        ));
      }

      const result = await query.limit(1);
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao verificar se palavra-chave existe:", error);
      return false;
    }
  }

  /**
   * Toggle status ativo/inativo
   */
  async toggleKeywordRoutingStatus(id: number): Promise<KeywordRouting> {
    try {
      // Buscar status atual
      const current = await this.getKeywordRouting(id);
      if (!current) {
        throw new Error("Configuração não encontrada");
      }

      // Inverter status
      const result = await db
        .update(keywordRouting)
        .set({
          isActive: !current.isActive,
          updatedAt: new Date(),
        })
        .where(eq(keywordRouting.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Erro ao alternar status:", error);
      throw error;
    }
  }
}