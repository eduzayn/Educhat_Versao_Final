/**
 * Utilitário para extração unificada de URLs de mídia
 * Centraliza a lógica de busca de URLs em diferentes formatos de metadados
 */

interface MediaExtractorResult {
  mediaUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  duration?: number;
}

/**
 * Extrai URL de mídia de uma mensagem baseado no tipo e metadados
 */
export function extractMediaUrl(
  messageType: string, 
  content: string | null, 
  metadata: any
): MediaExtractorResult {
  let mediaUrl: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let duration: number | undefined;

  // 1. Prioridade máxima: content com URL válida (novo formato)
  if (content && (content.startsWith('http') || content.startsWith('data:'))) {
    mediaUrl = content;
  }

  // 2. Buscar nos metadados se não encontrou no content
  if (!mediaUrl && metadata) {
    // Se metadata é uma string com data: diretamente
    if (typeof metadata === 'string' && metadata.startsWith('data:')) {
      mediaUrl = metadata;
      return { mediaUrl, fileName: `${messageType}.${messageType === 'video' ? 'mp4' : messageType === 'audio' ? 'ogg' : 'jpg'}`, mimeType: null };
    }
    
    // Se metadata tem a propriedade mediaUrl diretamente  
    if (typeof metadata === 'object' && metadata.mediaUrl && metadata.mediaUrl.startsWith('data:')) {
      mediaUrl = metadata.mediaUrl;
      fileName = metadata.fileName || `${messageType}.${messageType === 'video' ? 'mp4' : messageType === 'audio' ? 'ogg' : 'jpg'}`;
      mimeType = metadata.mimeType || null;
      return { mediaUrl, fileName, mimeType };
    }
    
    if (typeof metadata === 'object') {
    switch (messageType) {
      case 'image':
        mediaUrl = metadata.fileUrl || 
                  metadata.mediaUrl || 
                  metadata.image?.imageUrl || 
                  metadata.image?.url || 
                  metadata.imageUrl;
        fileName = metadata.fileName || metadata.image?.fileName || 'image.jpg';
        mimeType = metadata.mimeType || metadata.image?.mimeType || 'image/jpeg';
        break;

      case 'audio':
        mediaUrl = metadata.fileUrl || 
                  metadata.mediaUrl || 
                  metadata.audio?.audioUrl || 
                  metadata.audio?.url || 
                  metadata.audioUrl;
        fileName = metadata.fileName || metadata.audio?.fileName || 'audio.ogg';
        mimeType = metadata.mimeType || metadata.audio?.mimeType || 'audio/ogg';
        duration = metadata.duration || metadata.audio?.duration || 0;
        break;

      case 'video':
        mediaUrl = metadata.fileUrl || 
                  metadata.mediaUrl || 
                  metadata.video?.videoUrl || 
                  metadata.video?.url || 
                  metadata.videoUrl ||
                  (typeof metadata === 'string' && metadata.startsWith('data:video/') ? metadata : null);
        fileName = metadata.fileName || metadata.video?.fileName || 'video.mp4';
        mimeType = metadata.mimeType || metadata.video?.mimeType || 'video/mp4';
        break;

      case 'document':
        mediaUrl = metadata.fileUrl || 
                  metadata.mediaUrl || 
                  metadata.document?.documentUrl || 
                  metadata.document?.url || 
                  metadata.documentUrl;
        fileName = metadata.fileName || metadata.document?.fileName || 'document.pdf';
        mimeType = metadata.mimeType || metadata.document?.mimeType || 'application/pdf';
        break;

      default:
        // Para tipos desconhecidos, tentar mediaUrl genérico
        mediaUrl = metadata.mediaUrl || metadata.url;
        fileName = metadata.fileName || 'file';
        mimeType = metadata.mimeType || 'application/octet-stream';
    }
    }
  }

  return {
    mediaUrl,
    fileName,
    mimeType,
    duration
  };
}

/**
 * Verifica se uma URL de mídia é válida e acessível
 */
export function isValidMediaUrl(url: string | null): boolean {
  if (!url) return false;
  
  // URLs base64 são sempre válidas
  if (url.startsWith('data:')) return true;
  
  // URLs HTTP/HTTPS válidas
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Converte metadados antigos para o novo formato unificado
 */
export function normalizeMessageMetadata(messageType: string, metadata: any): any {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const result = extractMediaUrl(messageType, null, metadata);
  
  return {
    ...metadata,
    mediaUrl: result.mediaUrl,
    fileName: result.fileName,
    mimeType: result.mimeType,
    ...(result.duration && { duration: result.duration })
  };
}