import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { db } from '../db';
import { aiContext } from '../../shared/schema';
import { eq, desc, and, or, like } from 'drizzle-orm';
import { aiService } from './aiService';

export interface DocumentProcessingResult {
  success: boolean;
  text?: string;
  summary?: string;
  keywords?: string[];
  category?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    pages?: number;
    wordCount: number;
    processedAt: Date;
  };
  error?: string;
}

export class DocumentService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly supportedTypes = ['.pdf', '.docx', '.doc'];

  /**
   * Processa um documento (PDF ou DOCX) e extrai conteúdo
   */
  async processDocument(filePath: string, fileName: string): Promise<DocumentProcessingResult> {
    try {
      const fileExt = path.extname(fileName).toLowerCase();
      
      if (!this.supportedTypes.includes(fileExt)) {
        return {
          success: false,
          error: 'Tipo de arquivo não suportado. Use PDF ou DOCX.'
        };
      }

      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        return {
          success: false,
          error: 'Arquivo muito grande. Máximo 10MB.'
        };
      }

      let extractedText: string;
      let pageCount: number | undefined;

      if (fileExt === '.pdf') {
        const result = await this.processPDF(filePath);
        extractedText = result.text;
        pageCount = result.pages;
      } else {
        extractedText = await this.processDocx(filePath);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          error: 'Não foi possível extrair texto do documento.'
        };
      }

      // Processar texto com IA para extrair insights
      const aiAnalysis = await this.analyzeTextWithAI(extractedText);
      
      const wordCount = extractedText.split(/\s+/).length;

      const result: DocumentProcessingResult = {
        success: true,
        text: extractedText,
        summary: aiAnalysis.summary,
        keywords: aiAnalysis.keywords,
        category: aiAnalysis.category,
        metadata: {
          fileName,
          fileSize: stats.size,
          pages: pageCount,
          wordCount,
          processedAt: new Date()
        }
      };

      // Salvar contexto automaticamente na base de conhecimento
      await this.saveToKnowledgeBase(fileName, extractedText, aiAnalysis);

      return result;

    } catch (error) {
      console.error('❌ Erro ao processar documento:', error);
      return {
        success: false,
        error: 'Erro interno ao processar documento.'
      };
    }
  }

  /**
   * Processa arquivo PDF
   */
  private async processPDF(filePath: string): Promise<{ text: string; pages: number }> {
    // Temporariamente retornando mensagem informativa para PDFs
    // A funcionalidade completa será implementada após resolver dependências
    return {
      text: 'Processamento de PDF temporariamente indisponível. Utilize arquivos DOCX para processamento completo.',
      pages: 1
    };
  }

  /**
   * Processa arquivo DOCX
   */
  private async processDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Analisa texto extraído usando IA para gerar insights
   */
  private async analyzeTextWithAI(text: string): Promise<{
    summary: string;
    keywords: string[];
    category: string;
  }> {
    try {
      // Classificar conteúdo do documento
      const classification = await aiService.classifyMessage(
        `Analise este documento: ${text.substring(0, 2000)}...`,
        [], // Sem histórico
        {} // Sem contexto adicional
      );

      // Gerar resumo e palavras-chave usando IA
      const analysisPrompt = `
        Analise o seguinte texto de documento e forneça:
        1. Um resumo conciso (máximo 200 palavras)
        2. 5-10 palavras-chave principais
        3. Uma categoria educacional apropriada

        Texto do documento:
        ${text.substring(0, 3000)}...

        Responda em formato JSON:
        {
          "summary": "resumo aqui",
          "keywords": ["palavra1", "palavra2", ...],
          "category": "categoria"
        }
      `;

      // Usar OpenAI para análise se disponível
      const response = await aiService.generateResponse(
        analysisPrompt,
        classification,
        [],
        null
      );

      try {
        const analysis = JSON.parse(response.message);
        return {
          summary: analysis.summary || 'Resumo não disponível',
          keywords: analysis.keywords || [],
          category: analysis.category || 'Geral'
        };
      } catch {
        // Fallback se JSON não for válido
        return {
          summary: text.substring(0, 200) + '...',
          keywords: this.extractKeywords(text),
          category: this.categorizeContent(text)
        };
      }

    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      return {
        summary: text.substring(0, 200) + '...',
        keywords: this.extractKeywords(text),
        category: 'Documento'
      };
    }
  }

  /**
   * Extrai palavras-chave simples do texto (fallback)
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  /**
   * Categoriza conteúdo baseado em palavras-chave (fallback)
   */
  private categorizeContent(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('engenharia') || lowerText.includes('tecnologia')) {
      return 'Engenharia e Tecnologia';
    }
    if (lowerText.includes('educação') || lowerText.includes('ensino')) {
      return 'Educação';
    }
    if (lowerText.includes('negócio') || lowerText.includes('gestão')) {
      return 'Negócios';
    }
    if (lowerText.includes('saúde') || lowerText.includes('medicina')) {
      return 'Saúde';
    }
    
    return 'Geral';
  }

  /**
   * Salva conteúdo processado na base de conhecimento da Prof. Ana
   */
  private async saveToKnowledgeBase(
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

export const documentService = new DocumentService();