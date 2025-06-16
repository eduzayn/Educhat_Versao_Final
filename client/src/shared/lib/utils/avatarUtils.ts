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
  
  // Bloquear URLs de Gravatar para evitar 404s
  if (isGravatarUrl(url)) {
    return null;
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