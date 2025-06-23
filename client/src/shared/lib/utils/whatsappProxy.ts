/**
 * Utilitário para interceptar e corrigir URLs expiradas do WhatsApp
 * Substitui automaticamente URLs diretas do WhatsApp pelo sistema de proxy
 */

/**
 * Verifica se uma URL é do WhatsApp e pode expirar
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
  // CORREÇÃO: Verificar se já é uma URL de proxy para evitar double-encoding
  if (originalUrl.includes('/api/proxy/whatsapp-image')) {
    return originalUrl;
  }
  
  if (!isWhatsAppUrl(originalUrl)) {
    return originalUrl;
  }
  
  try {
    // Validar URL antes de processar
    new URL(originalUrl);
    
    // Encode a URL original para passar como query parameter
    const encodedUrl = encodeURIComponent(originalUrl);
    
    // Retornar URL do proxy interno
    return `/api/proxy/whatsapp-image?url=${encodedUrl}`;
  } catch (error) {
    console.error('❌ URL inválida para proxy:', originalUrl, error);
    return originalUrl; // Retornar URL original se inválida
  }
}

/**
 * Intercepta e substitui automaticamente URLs do WhatsApp em strings de conteúdo
 */
export function replaceWhatsAppUrls(content: string): string {
  if (!content || typeof content !== 'string') return content;
  
  // Regex para detectar URLs do WhatsApp
  const whatsappUrlRegex = /(https?:\/\/(?:pps|mmg|media)\.whatsapp\.net\/[^\s"'<>]+)/g;
  
  return content.replace(whatsappUrlRegex, (match) => {
    return getProxiedWhatsAppUrl(match);
  });
}

/**
 * Hook para URLs de mídia que automaticamente usa proxy para WhatsApp
 */
export function useMediaUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;
  
  if (isWhatsAppUrl(originalUrl)) {
    return getProxiedWhatsAppUrl(originalUrl);
  }
  
  return originalUrl;
}

/**
 * Intercepta erro 404 e tenta novamente com proxy
 */
export async function handleWhatsAppImageError(originalUrl: string): Promise<string> {
  if (!isWhatsAppUrl(originalUrl)) {
    throw new Error('URL não é do WhatsApp');
  }
  
  // Retornar URL do proxy como fallback
  return getProxiedWhatsAppUrl(originalUrl);
}