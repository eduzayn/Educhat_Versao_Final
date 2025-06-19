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
 * Verifica se uma URL é do WhatsApp
 */
export function isWhatsAppUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  return url.includes('pps.whatsapp.net') || 
         url.includes('mmg.whatsapp.net') ||
         url.includes('media.whatsapp.net');
}

/**
 * Converte URL do WhatsApp para usar o proxy interno
 */
export function getProxiedWhatsAppUrl(originalUrl: string): string {
  if (!isWhatsAppUrl(originalUrl)) {
    return originalUrl;
  }
  
  // Encode a URL original para passar como query parameter
  const encodedUrl = encodeURIComponent(originalUrl);
  
  // Retornar URL do proxy interno
  return `/api/proxy/whatsapp-image?url=${encodedUrl}`;
}

/**
 * Hook para URLs de avatar com sanitização automática e proxy para WhatsApp
 */
export function useSafeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Se for URL do WhatsApp, usar proxy para evitar erro 403
  if (isWhatsAppUrl(url)) {
    return getProxiedWhatsAppUrl(url);
  }
  
  return sanitizeAvatarUrl(url);
}