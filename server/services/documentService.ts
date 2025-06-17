import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { documents } from '../../shared/schema';
import { eq, like, or, desc, and } from 'drizzle-orm';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Serviço para gerenciamento de documentos
 */

interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  metadata?: DocumentMetadata;
  error?: string;
}

interface DocumentMetadata {
  title: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  pageCount?: number;
  wordCount?: number;
  format: string;
  size: number;
}

interface SearchResult {
  id: number;
  title: string;
  content: string;
  relevanceScore: number;
  metadata: DocumentMetadata;
}

class DocumentService {
  private readonly uploadDir = 'uploads/documents';
  private readonly allowedFormats = ['.pdf', '.doc', '.docx', '.txt', '.md'];

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Garante que o diretório de upload existe
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de uploads:', error);
    }
  }

  /**
   * Processa um documento carregado
   */
  async processDocument(file: Express.Multer.File, userId: string): Promise<DocumentProcessingResult> {
    try {
      const extension = path.extname(file.originalname).toLowerCase();
      
      if (!this.allowedFormats.includes(extension)) {
        return {
          success: false,
          error: `Formato não suportado: ${extension}`
        };
      }

      const content = await this.extractContent(file.buffer, extension);
      const metadata = await this.extractMetadata(file, content);

      // Salvar no banco de dados
      const [document] = await db
        .insert(documents)
        .values({
          title: file.originalname,
          content,
          format: extension.substring(1),
          size: file.size,
          userId,
          metadata: metadata as any,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return {
        success: true,
        content,
        metadata
      };

    } catch (error) {
      console.error('Erro ao processar documento:', error);
      return {
        success: false,
        error: 'Falha ao processar documento'
      };
    }
  }

  /**
   * Extrai conteúdo do arquivo baseado no formato
   */
  private async extractContent(buffer: Buffer, extension: string): Promise<string> {
    switch (extension) {
      case '.pdf':
        return await this.extractFromPDF(buffer);
      case '.doc':
      case '.docx':
        return await this.extractFromWord(buffer);
      case '.txt':
      case '.md':
        return buffer.toString('utf-8');
      default:
        throw new Error(`Formato não suportado: ${extension}`);
    }
  }

  /**
   * Extrai texto de arquivo PDF
   */
  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Falha ao processar arquivo PDF');
    }
  }

  /**
   * Extrai texto de documento Word
   */
  private async extractFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Erro ao extrair texto do Word:', error);
      throw new Error('Falha ao processar documento Word');
    }
  }

  /**
   * Extrai metadados do documento
   */
  private async extractMetadata(file: Express.Multer.File, content: string): Promise<DocumentMetadata> {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      title: file.originalname,
      format: path.extname(file.originalname).substring(1),
      size: file.size,
      wordCount,
      createdAt: new Date(),
      modifiedAt: new Date()
    };
  }

  /**
   * Busca documentos por texto
   */
  async searchDocuments(query: string, userId?: string, limit = 10): Promise<SearchResult[]> {
    try {
      const searchTerms = query.toLowerCase().split(/\s+/);
      
      // Construir query base
      let whereConditions = [];
      if (userId) {
        whereConditions.push(eq(documents.userId, userId));
      }

      const queryBuilder = db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          metadata: documents.metadata,
          createdAt: documents.createdAt
        })
        .from(documents);

      const results = whereConditions.length > 0 
        ? await queryBuilder
            .where(and(...whereConditions))
            .orderBy(desc(documents.createdAt))
            .limit(limit * 2)
        : await queryBuilder
            .orderBy(desc(documents.createdAt))
            .limit(limit * 2);

      // Calcular relevância e filtrar
      const scored = results
        .map(doc => {
          const relevanceScore = this.calculateRelevance(doc.content, doc.title, searchTerms);
          return {
            id: doc.id,
            title: doc.title,
            content: this.truncateContent(doc.content, 200),
            relevanceScore,
            metadata: doc.metadata as DocumentMetadata
          };
        })
        .filter(doc => doc.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      return scored;

    } catch (error) {
      console.error('Erro na busca de documentos:', error);
      return [];
    }
  }

  /**
   * Calcula pontuação de relevância
   */
  private calculateRelevance(content: string, title: string, searchTerms: string[]): number {
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      // Matches no título valem mais
      const titleMatches = (titleLower.match(new RegExp(term, 'g')) || []).length;
      score += titleMatches * 3;

      // Matches no conteúdo
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches;
    }

    return score;
  }

  /**
   * Trunca conteúdo para exibição
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Obtém documento por ID
   */
  async getDocument(id: number, userId?: string): Promise<any> {
    try {
      let queryBuilder = db
        .select()
        .from(documents)
        .where(eq(documents.id, id));

      if (userId) {
        queryBuilder = queryBuilder.where(eq(documents.userId, userId));
      }

      const result = await queryBuilder.limit(1);
      return result[0] || null;

    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      return null;
    }
  }

  /**
   * Remove documento
   */
  async deleteDocument(id: number, userId?: string): Promise<boolean> {
    try {
      let queryBuilder = db
        .delete(documents)
        .where(eq(documents.id, id));

      if (userId) {
        queryBuilder = queryBuilder.where(eq(documents.userId, userId));
      }

      await queryBuilder;
      return true;

    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      return false;
    }
  }

  /**
   * Lista documentos do usuário
   */
  async listDocuments(userId: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: documents.id,
          title: documents.title,
          format: documents.format,
          size: documents.size,
          createdAt: documents.createdAt,
          metadata: documents.metadata
        })
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset);

      return result;

    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de documentos
   */
  async getDocumentStats(userId?: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    formatBreakdown: Record<string, number>;
  }> {
    try {
      let queryBuilder = db.select().from(documents);
      
      if (userId) {
        queryBuilder = queryBuilder.where(eq(documents.userId, userId));
      }

      const docs = await queryBuilder;

      const formatBreakdown: Record<string, number> = {};
      let totalSize = 0;

      for (const doc of docs) {
        formatBreakdown[doc.format] = (formatBreakdown[doc.format] || 0) + 1;
        totalSize += doc.size || 0;
      }

      return {
        totalDocuments: docs.length,
        totalSize,
        formatBreakdown
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        formatBreakdown: {}
      };
    }
  }
}

export const documentService = new DocumentService();
export default documentService;