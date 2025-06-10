import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface WebCaptureResult {
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  url: string;
  metadata: {
    domain: string;
    wordCount: number;
    extractedAt: string;
  };
}

export class WebCaptureService {
  private static cleanUrl(url: string): string {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  private static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private static async fetchWebContent(url: string): Promise<{ content: string; title: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : this.getDomain(url);

      // Clean HTML content - remove scripts, styles, and extract text
      let content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      // Limit content size for AI processing
      if (content.length > 50000) {
        content = content.substring(0, 50000) + '...';
      }

      return { content, title };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha ao acessar o site: ${error.message}`);
      }
      throw new Error('Falha ao acessar o site');
    }
  }

  private static async analyzeWithAI(content: string, title: string, url: string): Promise<{
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
      console.error('Erro na análise com IA:', error);
      
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

  static async captureWebsite(inputUrl: string): Promise<WebCaptureResult> {
    const url = this.cleanUrl(inputUrl);
    const domain = this.getDomain(url);

    console.log(`🌐 Capturando conteúdo de: ${url}`);

    // Fetch web content
    const { content, title } = await this.fetchWebContent(url);
    
    if (!content || content.length < 100) {
      throw new Error('Conteúdo insuficiente encontrado no site');
    }

    console.log(`📄 Conteúdo extraído: ${content.length} caracteres`);

    // Analyze with AI
    const analysis = await this.analyzeWithAI(content, title, url);
    
    console.log(`🧠 Análise IA concluída: ${analysis.keywords.length} palavras-chave`);

    const result: WebCaptureResult = {
      title: analysis.improvedTitle,
      content: content,
      summary: analysis.summary,
      keywords: analysis.keywords,
      url: url,
      metadata: {
        domain: domain,
        wordCount: content.split(/\s+/).length,
        extractedAt: new Date().toISOString()
      }
    };

    return result;
  }

  static async captureMultipleUrls(urls: string[]): Promise<WebCaptureResult[]> {
    const results: WebCaptureResult[] = [];
    
    for (const url of urls) {
      try {
        const result = await this.captureWebsite(url);
        results.push(result);
      } catch (error) {
        console.error(`Erro ao capturar ${url}:`, error);
        // Continue with other URLs
      }
    }

    return results;
  }
}