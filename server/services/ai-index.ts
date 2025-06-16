import { AIClassification } from './ai-classification';
import { AIResponse } from './ai-response';
import { AIMemory } from './ai-memory';
import { AIContext } from './ai-context';
import { MessageClassification, AIResponse as AIResponseType } from './ai-types';

export class AIService {
  private classification: AIClassification;
  private response: AIResponse;
  private memory: AIMemory;
  private context: AIContext;

  constructor() {
    this.classification = new AIClassification();
    this.response = new AIResponse();
    this.memory = new AIMemory();
    this.context = new AIContext();
  }

  /**
   * Processa mensagem do usuário
   */
  async processMessage(
    message: string,
    conversationId: number,
    contactId: number,
    contactHistory?: any[]
  ): Promise<{
    classification: MessageClassification;
    response: AIResponseType;
  }> {
    try {
      // Classificar mensagem
      const classification = await this.classification.classifyMessage(
        message,
        contactId,
        conversationId,
        contactHistory
      );

      // Extrair e salvar memórias
      await this.memory.extractAndSaveMemories(
        message,
        classification,
        conversationId,
        contactId
      );

      // Gerar resposta
      const response = await this.response.generateResponse(
        message,
        classification,
        conversationId,
        contactId,
        contactHistory
      );

      return {
        classification,
        response
      };
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      throw error;
    }
  }

  /**
   * Inicia nova sessão de IA
   */
  async startSession(data: {
    conversationId: number;
    contactId: number;
    initialContext?: any;
  }): Promise<void> {
    await this.context.startSession(data);
  }

  /**
   * Finaliza sessão de IA
   */
  async endSession(conversationId: number): Promise<void> {
    await this.context.endSession(conversationId);
  }

  /**
   * Limpa dados expirados
   */
  async cleanup(): Promise<void> {
    await Promise.all([
      this.memory.cleanupExpiredMemories(),
      this.context.cleanupExpiredContexts()
    ]);
  }
}

// Exportar tipos
export * from './ai-types';

// Exportar instância única do serviço
export const aiService = new AIService(); 