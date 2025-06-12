/**
 * Utilitários de Formatação Unificados - EduChat
 * Módulo compartilhado entre client e server
 */

// ========== FORMATAÇÃO DE TELEFONE ==========
export function formatPhoneForDisplay(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    // Formato: +55 (11) 99999-9999
    const ddd = cleanPhone.substring(2, 4);
    const number = cleanPhone.substring(4);
    return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
  }
  
  if (cleanPhone.length === 11) {
    // Formato: (11) 99999-9999
    const ddd = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
  }
  
  if (cleanPhone.length === 10) {
    // Formato: (11) 9999-9999
    const ddd = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
  }
  
  return phone;
}

// ========== FORMATAÇÃO DE DOCUMENTOS ==========
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

// ========== FORMATAÇÃO DE DATA E HORA ==========
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function formatTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// ========== FORMATAÇÃO DE MOEDA ==========
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ========== FORMATAÇÃO DE DURAÇÃO ==========
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
}

export function formatDurationSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const formatAudioTime = formatDurationSeconds;

// ========== FORMATAÇÃO DE TEXTO ==========
export function capitalizeWords(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function formatInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ========== FORMATAÇÃO DE TAMANHO DE ARQUIVO ==========
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== ALIASES PARA COMPATIBILIDADE ==========
export const formatPhoneNumber = formatPhoneForDisplay;
export const formatName = capitalizeWords;