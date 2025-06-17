import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Serviço para captura e análise de conteúdo web
 */

interface WebCaptureResult {
  url: string;
  title: string;
  description: string;
  content: string;
  summary: string;
  keywords: string[];
  images: string[];
  links: string[];
  metadata: {
    domain: string;
    wordCount: number;
    extractedAt: string;
  };
  capturedAt: Date;
}

interface WebCaptureOptions {
  maxContentLength?: number;
  includeImages?: boolean;
  includeLinks?: boolean;
  timeout?: number;
}

class WebCaptureService {
  private readonly defaultOptions: Required<WebCaptureOptions> = {
    maxContentLength: 10000,
    includeImages: true,
    includeLinks: true,
    timeout: 10000
  };

  /**
   * Captura conteúdo de uma URL
   */
  async captureUrl(url: string, options: WebCaptureOptions = {}): Promise<WebCaptureResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const response = await axios.get(url, {
        timeout: opts.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extrair informações básicas
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Sem título';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';
      
      // Extrair conteúdo principal
      let content = '';
      $('p, h1, h2, h3, h4, h5, h6, li').each((_, element) => {
        const text = $(element).text().trim();
        if (text) {
          content += text + '\n';
        }
      });
      
      // Limitar tamanho do conteúdo
      if (content.length > opts.maxContentLength) {
        content = content.substring(0, opts.maxContentLength) + '...';
      }

      // Extrair imagens se solicitado
      const images: string[] = [];
      if (opts.includeImages) {
        $('img').each((_, element) => {
          const src = $(element).attr('src');
          if (src) {
            images.push(this.resolveUrl(src, url));
          }
        });
      }

      // Extrair links se solicitado
      const links: string[] = [];
      if (opts.includeLinks) {
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && !href.startsWith('#')) {
            links.push(this.resolveUrl(href, url));
          }
        });
      }

      // Gerar resumo (primeiros 200 caracteres do conteúdo)
      const summary = content.length > 200 ? content.substring(0, 200) + '...' : content;
      
      // Extrair palavras-chave simples (palavras mais frequentes)
      const keywords = this.extractKeywords(content);
      
      // Obter domínio
      const domain = new URL(url).hostname;
      
      // Contar palavras
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      return {
        url,
        title,
        description,
        content: content.trim(),
        summary,
        keywords,
        images,
        links,
        metadata: {
          domain,
          wordCount,
          extractedAt: new Date().toISOString()
        },
        capturedAt: new Date()
      };

    } catch (error) {
      console.error('Erro ao capturar URL:', error);
      throw new Error(`Falha ao capturar conteúdo da URL: ${url}`);
    }
  }

  /**
   * Captura múltiplas URLs em lote
   */
  async captureMultipleUrls(urls: string[], options: WebCaptureOptions = {}): Promise<WebCaptureResult[]> {
    const results: WebCaptureResult[] = [];
    
    for (const url of urls) {
      try {
        const result = await this.captureUrl(url, options);
        results.push(result);
      } catch (error) {
        console.error(`Erro ao capturar ${url}:`, error);
        // Continuar com as próximas URLs mesmo se uma falhar
      }
    }
    
    return results;
  }

  /**
   * Extrai apenas o texto principal de uma URL
   */
  async extractText(url: string): Promise<string> {
    try {
      const result = await this.captureUrl(url, {
        maxContentLength: 50000,
        includeImages: false,
        includeLinks: false
      });
      
      return result.content;
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      throw new Error(`Falha ao extrair texto da URL: ${url}`);
    }
  }

  /**
   * Verifica se uma URL é válida e acessível
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extrai palavras-chave do conteúdo
   */
  private extractKeywords(content: string): string[] {
    // Remover pontuação e converter para minúsculas
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Contar frequência das palavras
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Retornar as 10 palavras mais frequentes
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Resolve URLs relativos para absolutos
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      return url;
    }
  }

  /**
   * Extrai informações de redes sociais
   */
  async extractSocialMedia(url: string): Promise<Record<string, string>> {
    try {
      const response = await axios.get(url, {
        timeout: this.defaultOptions.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const social: Record<string, string> = {};

      // Open Graph tags
      $('meta[property^="og:"]').each((_, element) => {
        const property = $(element).attr('property');
        const content = $(element).attr('content');
        if (property && content) {
          social[property] = content;
        }
      });

      // Twitter Cards
      $('meta[name^="twitter:"]').each((_, element) => {
        const name = $(element).attr('name');
        const content = $(element).attr('content');
        if (name && content) {
          social[name] = content;
        }
      });

      return social;
    } catch (error) {
      console.error('Erro ao extrair informações de redes sociais:', error);
      return {};
    }
  }
}

export const webCaptureService = new WebCaptureService();
export default webCaptureService;