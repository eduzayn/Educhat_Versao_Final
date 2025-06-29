/**
 * Sistema de Verificação de Mídias Duplicadas
 * 
 * Implementa verificação para evitar processamento duplicado de mídias
 * baseado em hash do arquivo, URL da mídia ou messageId existente.
 * 
 * Exceção: Áudios gravados são sempre únicos (sem verificação)
 */

export interface MediaCheckResult {
  exists: boolean;
  existingMessageId?: number;
  existingMediaUrl?: string;
  hash?: string;
}

export interface MediaVerificationData {
  file?: File;
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
  messageId?: string;
  conversationId: number;
  mediaType: 'image' | 'video' | 'document' | 'audio';
}

/**
 * Gera hash SHA-256 de um arquivo File (frontend)
 */
export async function generateFileHashFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se uma mídia já existe no cache local ou via API
 */
export async function checkMediaExists(
  verificationData: MediaVerificationData
): Promise<MediaCheckResult> {
  const { file, fileName, fileSize, mediaUrl, messageId, conversationId, mediaType } = verificationData;

  // EXCEÇÃO: Áudios gravados são sempre únicos
  if (mediaType === 'audio') {
    return { exists: false };
  }

  try {
    // 1. Verificação por messageId da Z-API (via API backend)
    if (messageId) {
      const response = await fetch(`/api/messages/check-by-whatsapp-id/${messageId}`);
      if (response.ok) {
        const existingMessage = await response.json();
        if (existingMessage.exists) {
          return {
            exists: true,
            existingMessageId: existingMessage.messageId,
            existingMediaUrl: existingMessage.mediaUrl
          };
        }
      }
    }

    // 2. Verificação por URL da mídia
    if (mediaUrl) {
      const response = await fetch(`/api/messages/check-by-media-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl, conversationId })
      });
      if (response.ok) {
        const existingMessage = await response.json();
        if (existingMessage.exists) {
          return {
            exists: true,
            existingMessageId: existingMessage.messageId,
            existingMediaUrl: mediaUrl
          };
        }
      }
    }

    // 3. Verificação por hash do arquivo
    if (file) {
      const fileHash = await generateFileHashFromFile(file);
      const response = await fetch(`/api/messages/check-by-file-hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileHash, 
          conversationId,
          fileName: file.name,
          fileSize: file.size
        })
      });
      
      if (response.ok) {
        const existingMessage = await response.json();
        if (existingMessage.exists) {
          return {
            exists: true,
            existingMessageId: existingMessage.messageId,
            existingMediaUrl: existingMessage.mediaUrl,
            hash: fileHash
          };
        }
      }

      // Não existe, retornar hash para futura referência
      return { exists: false, hash: fileHash };
    }

    // 4. Verificação por nome e tamanho do arquivo (último recurso)
    if (fileName && fileSize) {
      const response = await fetch(`/api/messages/check-by-file-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileSize, conversationId })
      });
      
      if (response.ok) {
        const existingMessage = await response.json();
        if (existingMessage.exists) {
          return {
            exists: true,
            existingMessageId: existingMessage.messageId,
            existingMediaUrl: existingMessage.mediaUrl
          };
        }
      }
    }

    return { exists: false };

  } catch (error) {
    console.error('❌ Erro na verificação de mídia duplicada:', error);
    // Em caso de erro, permitir processamento (fail-safe)
    return { exists: false };
  }
}

/**
 * Atualiza metadados de mensagem com informações de verificação
 */
export function enrichMessageMetadata(
  metadata: any,
  verificationResult: MediaCheckResult,
  originalData: MediaVerificationData
): any {
  return {
    ...metadata,
    // Dados de verificação para auditoria
    verification: {
      checked: true,
      existsInSystem: verificationResult.exists,
      checkHash: verificationResult.hash,
      checkDate: new Date().toISOString()
    },
    // Dados originais do arquivo
    originalFile: originalData.fileName ? {
      name: originalData.fileName,
      size: originalData.fileSize,
      type: originalData.mediaType
    } : undefined
  };
}