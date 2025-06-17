import type { PerplexityResponse, PerplexityConfig } from './perplexity-types';

export class PerplexityOperations {
  private config: PerplexityConfig;

  constructor(config: PerplexityConfig) {
    this.config = config;
  }

  /**
   * Busca informações externas quando o contexto interno não é suficiente
   */
  async searchExternal(query: string, context: string): Promise<string | null> {
    if (!this.config.apiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY não configurada - busca externa desabilitada');
      return null;
    }

    try {
      console.log('🔍 Iniciando busca externa Perplexity para:', query.substring(0, 50) + '...');
      
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
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
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: this.config.topP
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
} 