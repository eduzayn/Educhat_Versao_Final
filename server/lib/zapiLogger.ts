/**
 * Sistema de logs padronizado para envios Z-API
 * Ativo apenas em produção ou com flag VITE_ENABLE_LOGS
 */

interface ZApiLogData {
  phone: string;
  messageType: 'TEXTO' | 'IMAGEM' | 'ÁUDIO' | 'VÍDEO' | 'DOCUMENTO';
  messageId?: string;
  duration?: number;
  fileSize?: number;
  fileName?: string;
  error?: any;
}

/**
 * Verifica se os logs devem ser exibidos
 */
function shouldLog(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VITE_ENABLE_LOGS === 'true';
}

/**
 * Formatar telefone para exibição
 */
function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length > 10 ? `+${cleanPhone}` : cleanPhone;
}

/**
 * Log de sucesso padronizado
 */
export function logZApiSuccess(data: ZApiLogData): void {
  if (!shouldLog()) return;

  const phone = formatPhone(data.phone);
  let message = `✅ Mensagem de ${data.messageType} enviada com sucesso via Z-API (Contato: ${phone}`;
  
  if (data.messageId) {
    message += `, ID: ${data.messageId}`;
  }
  
  // Adicionar informações específicas por tipo
  switch (data.messageType) {
    case 'ÁUDIO':
      if (data.duration) {
        message += `, Duração: ${Math.floor(data.duration)}s`;
      }
      break;
    case 'IMAGEM':
    case 'VÍDEO':
    case 'DOCUMENTO':
      if (data.fileSize) {
        message += `, Tamanho: ${Math.round(data.fileSize / 1024)}KB`;
      }
      if (data.fileName) {
        message += `, Arquivo: ${data.fileName}`;
      }
      break;
  }
  
  message += ')';
  console.log(message);
}

/**
 * Log de erro padronizado
 */
export function logZApiError(data: ZApiLogData): void {
  if (!shouldLog()) return;

  const phone = formatPhone(data.phone);
  let message = `❌ Falha ao enviar mensagem de ${data.messageType} via Z-API (Contato: ${phone}`;
  
  if (data.messageId) {
    message += `, ID: ${data.messageId}`;
  }
  
  message += ')';
  
  if (data.error) {
    const errorMsg = data.error instanceof Error ? data.error.message : String(data.error);
    message += ` - Motivo: ${errorMsg}`;
  }
  
  console.error(message);
}

/**
 * Log de tentativa de envio (debug)
 */
export function logZApiAttempt(data: ZApiLogData): void {
  if (!shouldLog()) return;

  const phone = formatPhone(data.phone);
  console.log(`🚀 Iniciando envio de ${data.messageType} via Z-API (Contato: ${phone})`);
}