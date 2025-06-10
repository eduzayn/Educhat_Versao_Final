interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
      console.log('🔍 Iniciando busca externa Perplexity para:', query.substring(0, 50) + '...');
      
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
              content: `Você é um assistente de pesquisa para a Prof. Ana, uma IA educacional brasileira.

              CONTEXTO INTERNO DISPONÍVEL: ${context ? context.substring(0, 500) : 'Nenhum contexto relevante encontrado'}

              INSTRUÇÕES:
              - Busque informações complementares e atualizadas sobre a pergunta
              - Foque em: educação, cursos, certificações, mercado de trabalho, regulamentações
              - Priorize fontes confiáveis e informações brasileiras quando relevante
              - Retorne resposta concisa (máximo 200 palavras) em português brasileiro
              - Se não encontrar informações confiáveis, seja honesto sobre isso`
            },
            {
              role: 'user',
              content: `Pergunta do usuário: ${query}`
            }
          ],
          max_tokens: 350,
          temperature: 0.2,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API Perplexity:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as PerplexityResponse;
      const result = data.choices[0]?.message?.content || null;
      
      if (result) {
        console.log('✅ Busca externa Perplexity concluída com sucesso');
        if (data.usage) {
          console.log(`📊 Tokens utilizados: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
        }
      } else {
        console.warn('⚠️ Perplexity retornou resposta vazia');
      }
      
      return result;

    } catch (error) {
      console.error('❌ Erro na busca externa Perplexity:', error);
      return null;
    }
  }

  /**
   * Verifica se uma busca externa é necessária baseada na confiança do contexto interno
   */
  shouldSearchExternal(confidence: number, hasRelevantContext: boolean): boolean {
    // Buscar externamente se:
    // - Confiança baixa (< 70%)
    // - Não há contexto relevante
    // - Mesmo com contexto, confiança muito baixa (< 50%)
    return confidence < 70 || !hasRelevantContext || (hasRelevantContext && confidence < 50);
  }

  /**
   * Valida se a resposta externa é útil e confiável
   */
  validateExternalResponse(response: string): boolean {
    if (!response || response.length < 20) return false;
    
    // Verificar se não são respostas genéricas demais
    const lowQualityIndicators = [
      'não posso ajudar',
      'não tenho informações',
      'consulte um especialista',
      'entre em contato',
      'não é possível'
    ];
    
    const responseLower = response.toLowerCase();
    return !lowQualityIndicators.some(indicator => responseLower.includes(indicator));
  }
}

export const perplexityService = new PerplexityService();