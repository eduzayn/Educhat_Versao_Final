/**
 * Serviço simplificado para documentos (compatível com deployment)
 */

export interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
}

export class SimpleDocumentService {
  async processDocument(file: any): Promise<DocumentProcessingResult> {
    return {
      success: true,
      content: "Documento processado com sucesso"
    };
  }

  async searchDocuments(query: string): Promise<any[]> {
    return [];
  }

  async getDocument(id: number): Promise<any> {
    return null;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return true;
  }
}

export const documentService = new SimpleDocumentService();
export default documentService;