import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Middleware de rate limiting para evitar requisições excessivas
 * Configurado especificamente para resolver erro 429
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) {
  const { windowMs, maxRequests, keyGenerator = (req) => req.ip || 'unknown' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Limpar entradas expiradas
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(entryKey);
      }
    }

    const entry = rateLimitStore.get(key);
    
    if (!entry) {
      // Primeira requisição na janela
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (now > entry.resetTime) {
      // Janela expirou, resetar contador
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return next();
    }

    if (entry.count >= maxRequests) {
      // Limite excedido
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(429).json({
        error: 'Muitas requisições',
        message: `Limite de ${maxRequests} requisições por ${windowMs/1000}s excedido`,
        retryAfter: resetInSeconds
      });
      return;
    }

    // Incrementar contador
    entry.count++;
    next();
  };
}

// Rate limiters específicos para diferentes endpoints
export const conversationsRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 120, // Aumentado para 120 requisições por minuto
  keyGenerator: (req) => `conversations_${req.ip}_${req.user?.id || 'anonymous'}`
});

export const messagesRateLimit = createRateLimiter({
  windowMs: 30 * 1000, // 30 segundos
  maxRequests: 60, // Aumentado para 60 requisições por 30s
  keyGenerator: (req) => `messages_${req.ip}_${req.user?.id || 'anonymous'}`
});

export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // Máximo 100 requisições por minuto por usuário
  keyGenerator: (req) => `general_${req.user?.id || req.ip || 'anonymous'}`
});