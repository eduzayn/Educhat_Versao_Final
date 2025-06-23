import { db } from './db';

// Wrapper com retry automático para operações de banco
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é erro de timeout/conexão que vale a pena retry
      const isRetryableError = error.message?.includes('fetch failed') ||
                               error.message?.includes('ETIMEDOUT') ||
                               error.message?.includes('connection') ||
                               error.code === 'ETIMEDOUT' ||
                               error.code === 'ECONNRESET';
      
      if (!isRetryableError || attempt === maxRetries) {
        throw error;
      }
      
      // Delay exponencial com jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⚠️ Tentativa ${attempt}/${maxRetries} falhou, retry em ${Math.round(delay)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Export do db com retry automático para operações críticas
export { db };