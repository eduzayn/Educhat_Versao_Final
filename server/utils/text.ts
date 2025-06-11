/**
 * Utilitários de Texto - Consolidação de funções de texto dispersas
 */

/**
 * Extrai menções (@usuario) do texto
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

/**
 * Extrai hashtags (#tag) do texto
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return hashtags;
}

/**
 * Conta palavras no texto
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extrai palavras-chave do texto (palavras com mais de 3 caracteres)
 */
export function extractKeywords(text: string, minLength: number = 4): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length >= minLength);
  
  return Array.from(new Set(words));
}

/**
 * Calcula similaridade entre dois textos (algoritmo simples)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Destaca termos de busca no texto
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}

/**
 * Converte texto para formato de busca (remove acentos, converte para minúsculo)
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Gera resumo do texto limitando por número de palavras
 */
export function generateSummary(text: string, maxWords: number = 50): string {
  const words = text.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Verifica se o texto contém spam (palavras comuns de spam)
 */
export function detectSpam(text: string): boolean {
  const spamKeywords = [
    'ganhe dinheiro', 'clique aqui', 'oferta imperdível', 'promoção relâmpago',
    'urgente', 'grátis', 'desconto', 'click here', 'buy now', 'limited time'
  ];
  
  const lowerText = text.toLowerCase();
  return spamKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Máscara para informações sensíveis
 */
export function maskSensitiveInfo(text: string): string {
  // Máscara para CPF
  text = text.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**');
  
  // Máscara para telefone
  text = text.replace(/\(\d{2}\)\s\d{4,5}-\d{4}/g, '(**) ****-****');
  
  // Máscara para email
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***');
  
  return text;
}