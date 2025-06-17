import { PerplexityOperations } from './perplexityOperations';
import { PerplexityValidation } from './perplexityValidation';
import type { PerplexityConfig } from './perplexity-types';

export class PerplexityService {
  private operations: PerplexityOperations;
  private validation: PerplexityValidation;
  private config: PerplexityConfig;

  constructor() {
    this.config = {
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      baseUrl: 'https://api.perplexity.ai/chat/completions',
      model: 'llama-3.1-sonar-small-128k-online',
      maxTokens: 350,
      temperature: 0.2,
      topP: 0.9
    };

    this.operations = new PerplexityOperations(this.config);
    this.validation = new PerplexityValidation();
  }

  /**
   * Busca informações externas quando o contexto interno não é suficiente
   */
  async searchExternal(query: string, context: string): Promise<string | null> {
    return this.operations.searchExternal(query, context);
  }

  /**
   * Verifica se uma busca externa é necessária baseada na confiança do contexto interno
   */
  shouldSearchExternal(confidence: number, hasRelevantContext: boolean): boolean {
    return this.validation.shouldSearchExternal(confidence, hasRelevantContext);
  }

  /**
   * Valida se a resposta externa é útil e confiável
   */
  validateExternalResponse(response: string): boolean {
    return this.validation.validateExternalResponse(response);
  }
}

export const perplexityService = new PerplexityService();