// DEPRECATED: Este serviço foi consolidado em unifiedAssignmentService.ts
// Mantido para compatibilidade durante migração
import { IntelligentHandoffOperations } from './intelligentHandoffOperations';
import type { MessageClassification, HandoffRecommendation } from './intelligentHandoff-types';

export class IntelligentHandoffService {
  private operations: IntelligentHandoffOperations;

  constructor() {
    this.operations = new IntelligentHandoffOperations();
  }

  /**
   * Analisa e recomenda o melhor destino para handoff baseado em IA e capacidade real
   */
  async analyzeAndRecommendHandoff(
    conversationId: number,
    messageContent: string,
    aiClassification: MessageClassification
  ): Promise<HandoffRecommendation> {
    return this.operations.analyzeAndRecommendHandoff(conversationId, messageContent, aiClassification);
  }

  /**
   * Executa handoff inteligente baseado na recomendação
   */
  async executeIntelligentHandoff(
    conversationId: number,
    recommendation: HandoffRecommendation,
    aiClassification: MessageClassification,
    type: 'automatic' | 'manual' = 'automatic'
  ): Promise<number> {
    return this.operations.executeIntelligentHandoff(conversationId, recommendation, aiClassification, type);
  }

  /**
   * Obtém estatísticas de performance do sistema inteligente
   */
  async getIntelligentHandoffStats(days: number = 7): Promise<any> {
    return this.operations.getIntelligentHandoffStats(days);
  }
}

export const intelligentHandoffService = new IntelligentHandoffService();