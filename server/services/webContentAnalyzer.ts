import Anthropic from '@anthropic-ai/sdk';
import { aiConfigService } from './aiConfigService';
import { AIErrorHandler } from '../middleware/aiErrorHandler';

export class WebContentAnalyzer {
  static async analyzeWithAI(content: string, title: string, url: string): Promise<{
    summary: string;
    keywords: string[];
    improvedTitle: string;
  }> {
    try {
      // Buscar configurações de IA
      const anthropicKey = await aiConfigService.getAnthropicKey();
      if (!anthropicKey) {
        throw new Error('Chave da Anthropic não configurada');
      }

      const anthropic = new Anthropic({
        apiKey: anthropicKey,
      });

      const prompt: string = `Analise o seguinte conteúdo de site e forneça:

1. Um resumo conciso (2-3 parágrafos) do conteúdo principal
2. Lista de 8-12 palavras-chave relevantes em português
3. Um título melhorado para o contexto educacional

Conteúdo do site "${title}" (${url}):

${content}

Responda em JSON com as chaves: "summary", "keywords" (array), "improvedTitle"`;

      const responseSettings = await aiConfigService.getResponseSettings();
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: responseSettings.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseContent = response.content[0];
      if (responseContent.type !== 'text') {
        throw new Error('Resposta inesperada da IA');
      }
      const result = JSON.parse(responseContent.text);
      return {
        summary: result.summary || 'Resumo não disponível',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        improvedTitle: result.improvedTitle || title
      };
    } catch (error) {
      AIErrorHandler.logError('anthropic', error, 'web_content_analysis');
      // Fallback analysis
      const words = content.toLowerCase().split(/\s+/);
      const wordCount: Record<string, number> = {};
      words.forEach(word => {
        if (word.length > 4) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      const keywords = Object.entries(wordCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 8)
        .map(([word]) => word);
      return {
        summary: content.substring(0, 500) + '...',
        keywords,
        improvedTitle: title
      };
    }
  }
} 