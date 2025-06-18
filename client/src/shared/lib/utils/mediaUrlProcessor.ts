/*
 * ⚠️  UTILITÁRIO PROTEGIDO - SISTEMA DE CARREGAMENTO DE MÍDIAS SOB DEMANDA ⚠️
 * 
 * Este utilitário é CRÍTICO para o funcionamento do carregamento sob demanda.
 * O sistema está ESTÁVEL e NÃO deve ser modificado sem autorização explícita.
 * 
 * Data de Proteção: 18/06/2025
 * Status: SISTEMA ESTÁVEL - NÃO MODIFICAR
 */

/**
 * Processador otimizado de URLs de mídia
 * Centraliza a lógica de extração e validação de URLs de mídia
 */

interface MediaUrlInfo {
  url: string | null;
  isDirectUrl: boolean;
  needsLoading: boolean;
  type: 'data' | 'http' | 'file' | 'unknown';
}

/**
 * Processa e extrai informações sobre a URL de mídia
 */
export function processMediaUrl(metadata?: any, content?: string | null): MediaUrlInfo {
  // Prioridade 1: content direto
  if (content && isValidMediaUrl(content)) {
    return {
      url: content,
      isDirectUrl: true,
      needsLoading: false,
      type: getUrlType(content)
    };
  }

  // Prioridade 2: metadata com URLs diretas
  if (metadata) {
    const potentialUrls = [
      metadata.fileUrl,
      metadata.mediaUrl,
      metadata.url,
      metadata.image?.imageUrl,
      metadata.audio?.audioUrl,
      metadata.video?.videoUrl,
      metadata.document?.documentUrl
    ].filter(Boolean);

    for (const url of potentialUrls) {
      if (isValidMediaUrl(url)) {
        return {
          url,
          isDirectUrl: true,
          needsLoading: false,
          type: getUrlType(url)
        };
      }
    }
  }

  // Sem URL válida encontrada
  return {
    url: null,
    isDirectUrl: false,
    needsLoading: true,
    type: 'unknown'
  };
}

/**
 * Verifica se uma URL é válida para mídia
 */
function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  return url.startsWith('http') || 
         url.startsWith('https') || 
         url.startsWith('data:') || 
         url.startsWith('/');
}

/**
 * Determina o tipo da URL
 */
function getUrlType(url: string): 'data' | 'http' | 'file' | 'unknown' {
  if (url.startsWith('data:')) return 'data';
  if (url.startsWith('http')) return 'http';
  if (url.startsWith('/')) return 'file';
  return 'unknown';
}

/**
 * Verifica se a mídia pode ser carregada imediatamente
 */
export function canLoadImmediately(mediaInfo: MediaUrlInfo): boolean {
  return mediaInfo.isDirectUrl && !mediaInfo.needsLoading;
}