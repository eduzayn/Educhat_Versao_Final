import { db } from '../db';
import { aiContext } from '../../shared/schema';
import { eq, desc, and, or, like } from 'drizzle-orm';

export class DocumentStorage {
  /**
   * Salva conteúdo processado na base de conhecimento da Prof. Ana
   */
  async saveToKnowledgeBase(
    fileName: string, 
    content: string, 
    analysis: { summary: string; keywords: string[]; category: string }
  ): Promise<void> {
    try {
      await db.insert(aiContext).values({
        name: `Documento: ${fileName}`,
        type: 'document',
        content: content,
        metadata: {
          fileName,
          category: analysis.category,
          keywords: analysis.keywords,
          summary: analysis.summary,
          processedAt: new Date().toISOString(),
          wordCount: content.split(/\s+/).length
        }
      });

      console.log(`✅ Documento ${fileName} salvo na base de conhecimento`);
    } catch (error) {
      console.error('❌ Erro ao salvar na base de conhecimento:', error);
    }
  }

  /**
   * Lista documentos processados recentemente
   */
  async getRecentDocuments(limit = 10): Promise<any[]> {
    try {
      const documents = await db.select({
        id: aiContext.id,
        name: aiContext.name,
        type: aiContext.type,
        content: aiContext.content,
        metadata: aiContext.metadata,
        createdAt: aiContext.createdAt
      })
      .from(aiContext)
      .where(eq(aiContext.type, 'document'))
      .orderBy(desc(aiContext.createdAt))
      .limit(limit);

      return documents;
    } catch (error) {
      console.error('❌ Erro ao buscar documentos:', error);
      return [];
    }
  }

  /**
   * Busca documentos por palavras-chave
   */
  async searchDocuments(query: string): Promise<any[]> {
    try {
      const documents = await db.select()
        .from(aiContext)
        .where(
          and(
            eq(aiContext.type, 'document'),
            or(
              like(aiContext.name, `%${query}%`),
              like(aiContext.content, `%${query}%`)
            )
          )
        )
        .orderBy(desc(aiContext.createdAt))
        .limit(20);

      return documents;
    } catch (error) {
      console.error('❌ Erro na busca de documentos:', error);
      return [];
    }
  }
} 