import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class WebContentAnalyzer {
  static async analyzeWithAI(content: string, title: string, url: string): Promise<{
    summary: string;
    keywords: string[];
    improvedTitle: string;
  }> {
    try {
      const prompt: string = `Analise o seguinte conteúdo de site e forneça:

1. Um resumo conciso (2-3 parágrafos) do conteúdo principal
2. Lista de 8-12 palavras-chave relevantes em português
3. Um título melhorado para o contexto educacional

Conteúdo do site "${title}" (${url}):

${content}

Responda em JSON com as chaves: "summary", "keywords" (array), "improvedTitle"`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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