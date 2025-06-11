/**
 * Utilitários de Formatação - Consolidação de funções de formatação dispersas
 */

/**
 * Formata telefone brasileiro para exibição
 */
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
  
  return phone;
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

/**
 * Formata data para formato brasileiro
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para formato brasileiro
 */
export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR');
}

/**
 * Formata valor monetário para Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizeWords(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Trunca texto mantendo palavras completas
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Remove acentos de texto
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Cria slug a partir de texto
 */
export function createSlug(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Formata tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}