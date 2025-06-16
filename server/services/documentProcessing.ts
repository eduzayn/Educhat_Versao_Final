import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { DocumentProcessingResult } from './document-types';

export class DocumentProcessor {
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

      const wordCount = extractedText.split(/\s+/).length;

      return {
        success: true,
        text: extractedText,
        metadata: {
          fileName,
          fileSize: stats.size,
          pages: pageCount,
          wordCount,
          processedAt: new Date()
        }
      };

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
} 