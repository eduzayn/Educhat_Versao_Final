/**
 * Utilitários de formatação compartilhados
 * Centraliza funções de formatação para evitar duplicação de código
 */

/**
 * Formata tempo em segundos para MM:SS
 */
export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formata data para exibição amigável
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "agora";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
}

/**
 * Formata tamanho de arquivo em bytes para formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formata duração em milissegundos para formato legível
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }
}

/**
 * Formata número de telefone brasileiro
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11 && cleaned.startsWith("55")) {
    // Formato: +55 (XX) 9XXXX-XXXX
    const ddd = cleaned.substring(2, 4);
    const first = cleaned.substring(4, 9);
    const second = cleaned.substring(9);
    return `+55 (${ddd}) ${first}-${second}`;
  } else if (cleaned.length === 13 && cleaned.startsWith("55")) {
    // Formato internacional: +55 XX 9XXXX-XXXX
    const ddd = cleaned.substring(2, 4);
    const first = cleaned.substring(4, 9);
    const second = cleaned.substring(9);
    return `+55 ${ddd} ${first}-${second}`;
  }
  
  return phone; // Retorna original se não conseguir formatar
}