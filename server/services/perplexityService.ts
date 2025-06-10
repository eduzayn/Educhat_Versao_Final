import fetch from 'node-fetch';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Busca informações externas quando o contexto interno não é suficiente
   */
  async searchExternal(query: string, context: string): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY não configurada - busca externa desabilitada');
      return null;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente de pesquisa para a Prof. Ana, uma IA educacional.
              
              Contexto interno disponível: ${context}
              
              Busque informações complementares e atualizadas sobre a pergunta do usuário.
              Foque em informações educacionais, cursos, mercado de trabalho e regulamentações.
              Retorne uma resposta concisa e confiável em português brasileiro.`
            },
            {
              role: 'user',
              content: `Pergunta: ${query}`
            }
          ],
          max_tokens: 300,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json() as PerplexityResponse;
      return data.choices[0]?.message?.content || null;

    } catch (error) {
      console.error('❌ Erro na busca externa Perplexity:', error);
      return null;
    }
  }

  /**
   * Verifica se uma busca externa é necessária baseada na confiança do contexto interno
   */
  shouldSearchExternal(confidence: number, hasRelevantContext: boolean): boolean {
    return confidence < 70 || !hasRelevantContext;
  }
}

export const perplexityService = new PerplexityService();