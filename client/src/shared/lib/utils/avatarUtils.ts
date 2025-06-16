/**
 * Utilitário para gerenciar avatars e interceptar URLs de Gravatar
 * Previne requisições 404 para gravatar.com
 */

/**
 * Verifica se uma URL é do Gravatar
 */
export function isGravatarUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('gravatar.com') || url.includes('www.gravatar.com');
}

/**
 * Sanitiza URLs de avatar removendo Gravatars inválidos
 */
export function sanitizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Se for URL do Gravatar, adiciona parâmetro d=identicon para garantir fallback
  if (isGravatarUrl(url)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}d=identicon`;
  }
  
  // Verificar se é uma URL válida
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }
  
  return url;
}

/**
 * Gera iniciais para fallback de avatar
 */
export function getAvatarInitials(name?: string | null): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Hook para URLs de avatar com sanitização automática
 */
export function useSafeAvatarUrl(url: string | null | undefined): string | null {
  return sanitizeAvatarUrl(url);
}