/**
 * Utilitários Centralizados - Consolidação de funções helper dispersas
 * Substitui múltiplos arquivos de utilitários espalhados pelo sistema
 */

// Re-exports organizados por categoria
export * from './api';
export * from './validation';
export * from './formatting';
export * from './course';
export * from './zapi';
export * from './date';
export * from './text';
export * from './auth';

// Utilitários legados mantidos para compatibilidade
export { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from './zapi';
export { detectCourses, getCourseCategories, getCoursesByCategory } from './course';
export { isValidEmail, normalizePhoneNumber, isValidCPF } from './validation';
export { formatPhoneForDisplay, formatCurrency, formatDateBR } from './formatting';