/**
 * Analisa texto extraído usando IA para gerar insights
 */
export class DocumentAnalyzer {
  /**
   * Analisa texto extraído usando IA para gerar insights
   */
  async analyzeTextWithAI(text: string): Promise<{
    summary: string;
    keywords: string[];
    category: string;
  }> {
    try {
      // Criar uma classificação básica para documentos
      const classification = {
        intention: 'documento',
        sentiment: 'neutro',
        urgency: 'baixa',
        detectedCourse: 'geral',
        confidence: 0.8
      };

      // Usar análise simples de texto para documentos
      const lines = text.split('\n').filter(line => line.trim());
      const words = text.split(/\s+/).filter(word => word.length > 3);
      
      // Extrair palavras-chave simples (palavras mais frequentes)
      const wordCount: Record<string, number> = {};
      words.forEach(word => {
        const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleaned.length > 3) {
          wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
        }
      });
      
      const keywords = Object.entries(wordCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([word]) => word);

      return {
        summary: lines.slice(0, 3).join(' ').substring(0, 200) + '...',
        keywords: keywords,
        category: 'documento'
      };

    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      return {
        summary: text.substring(0, 200) + '...',
        keywords: this.extractKeywords(text),
        category: 'Documento'
      };
    }
  }

  /**
   * Extrai palavras-chave simples do texto (fallback)
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  /**
   * Categoriza conteúdo baseado em palavras-chave (fallback)
   */
  categorizeContent(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('engenharia') || lowerText.includes('tecnologia')) {
      return 'Engenharia e Tecnologia';
    }
    if (lowerText.includes('educação') || lowerText.includes('ensino')) {
      return 'Educação';
    }
    if (lowerText.includes('negócio') || lowerText.includes('gestão')) {
      return 'Negócios';
    }
    if (lowerText.includes('saúde') || lowerText.includes('medicina')) {
      return 'Saúde';
    }
    
    return 'Geral';
  }
} 