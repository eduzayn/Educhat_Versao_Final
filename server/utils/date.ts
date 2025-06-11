/**
 * Utilitários de Data - Consolidação de funções de data dispersas
 */

/**
 * Calcula diferença em dias entre duas datas
 */
export function daysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Verifica se uma data é ontem
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

/**
 * Formata tempo relativo (ex: "há 2 horas", "há 3 dias")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  if (diffInHours < 24) return `há ${diffInHours}h`;
  if (diffInDays === 1) return 'ontem';
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `há ${months} mês${months > 1 ? 'es' : ''}`;
  }
  
  const years = Math.floor(diffInDays / 365);
  return `há ${years} ano${years > 1 ? 's' : ''}`;
}

/**
 * Adiciona dias a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adiciona horas a uma data
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Obtém início do dia
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtém fim do dia
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Verifica se está dentro do horário comercial (9h às 18h)
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = domingo, 6 = sábado
  
  // Verifica se é dia útil (segunda a sexta)
  if (day === 0 || day === 6) return false;
  
  // Verifica se está entre 9h e 18h
  return hour >= 9 && hour < 18;
}