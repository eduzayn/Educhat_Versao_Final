/**
 * Utilitários de Autenticação - Consolidação de funções de auth dispersas
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Gera hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera token seguro para reset de senha
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gera código numérico para verificação
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return code;
}

/**
 * Valida força da senha
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento mínimo
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('A senha deve ter pelo menos 8 caracteres');
  }

  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('A senha deve conter pelo menos uma letra minúscula');
  }

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('A senha deve conter pelo menos uma letra maiúscula');
  }

  // Números
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('A senha deve conter pelo menos um número');
  }

  // Caracteres especiais
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('A senha deve conter pelo menos um caractere especial');
  }

  // Comprimento ideal
  if (password.length >= 12) {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

/**
 * Extrai informações do token JWT (sem verificação)
 */
export function parseJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Gera sessão ID única
 */
export function generateSessionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Valida formato de email
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calcula tempo até expiração de token
 */
export function getTokenTimeRemaining(expirationTime: number): number {
  return Math.max(0, expirationTime - Date.now());
}

/**
 * Verifica se token está expirado
 */
export function isTokenExpired(expirationTime: number): boolean {
  return Date.now() >= expirationTime;
}