/**
 * Utilitários de Validação - Consolidação de funções de validação dispersas
 */

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de telefone brasileiro
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Aceita formatos: 11999999999, 5511999999999
  return /^(\d{10,11}|\d{13})$/.test(cleanPhone);
}

/**
 * Normaliza número de telefone para formato padrão
 */
export function normalizePhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se começar com 55 (código do Brasil), mantém
  if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
    return cleanPhone;
  }
  
  // Se tem 11 dígitos (celular com DDD), adiciona 55
  if (cleanPhone.length === 11) {
    return '55' + cleanPhone;
  }
  
  // Se tem 10 dígitos (fixo com DDD), adiciona 55
  if (cleanPhone.length === 10) {
    return '55' + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Valida CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

/**
 * Valida se uma string não está vazia após trim
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida se um valor está dentro de um range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Valida formato de URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se um objeto tem todas as propriedades obrigatórias
 */
export function hasRequiredFields(obj: any, requiredFields: string[]): boolean {
  return requiredFields.every(field => obj.hasOwnProperty(field) && obj[field] !== null && obj[field] !== undefined);
}