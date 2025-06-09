/**
 * Middleware de Validação para Rotas de Canais
 * Implementa validações automáticas e proteções contra alterações incorretas
 */

import { Request, Response, NextFunction } from 'express';
import { channelValidations, backupControls, protectionMiddleware, securityConfig } from './protection-system';

// Cache para controle de rate limiting
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();

// Middleware de validação de entrada para canais
export const validateChannelInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitizar dados de entrada
    if (req.body.name) {
      req.body.name = req.body.name.trim();
      if (req.body.name.length > securityConfig.inputSanitization.maxNameLength) {
        return res.status(400).json({
          error: `Nome do canal não pode exceder ${securityConfig.inputSanitization.maxNameLength} caracteres`
        });
      }
    }

    if (req.body.description) {
      req.body.description = req.body.description.trim();
      if (req.body.description.length > securityConfig.inputSanitization.maxDescriptionLength) {
        return res.status(400).json({
          error: `Descrição não pode exceder ${securityConfig.inputSanitization.maxDescriptionLength} caracteres`
        });
      }
    }

    // Verificar caracteres proibidos
    const checkForbiddenChars = (text: string) => {
      return securityConfig.inputSanitization.forbiddenChars.some(char => text.includes(char));
    };

    if (req.body.name && checkForbiddenChars(req.body.name)) {
      return res.status(400).json({
        error: 'Nome contém caracteres não permitidos'
      });
    }

    // Validar tipo de canal
    if (req.body.type && !securityConfig.inputSanitization.allowedTypes.includes(req.body.type)) {
      return res.status(400).json({
        error: 'Tipo de canal não permitido'
      });
    }

    // Validações específicas do canal
    const validationErrors = channelValidations.validateChannelData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationErrors
      });
    }

    next();
  } catch (error) {
    console.error('[VALIDATION_ERROR]', error);
    res.status(500).json({ error: 'Erro interno de validação' });
  }
};

// Middleware de rate limiting
export const rateLimitMiddleware = (operation: 'creation' | 'qrGeneration' | 'connectionTests') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${operation}:${clientIP}`;
    const now = Date.now();
    
    const config = securityConfig.rateLimits[operation === 'creation' ? 'channelCreation' : 
                   operation === 'qrGeneration' ? 'qrGeneration' : 'connectionTests'];
    
    let limitData = rateLimitCache.get(key);
    
    if (!limitData || now > limitData.resetTime) {
      limitData = { count: 0, resetTime: now + config.window };
      rateLimitCache.set(key, limitData);
    }
    
    if (limitData.count >= config.max) {
      const resetIn = Math.ceil((limitData.resetTime - now) / 1000);
      return res.status(429).json({
        error: 'Limite de operações excedido',
        resetIn: `${resetIn} segundos`
      });
    }
    
    limitData.count++;
    next();
  };
};

// Middleware de backup automático
export const autoBackupMiddleware = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Criar backup antes de operações destrutivas
      if (['PUT', 'DELETE'].includes(req.method)) {
        const channelId = req.params.id;
        if (channelId) {
          // Aqui você pegaria os dados atuais do canal do banco
          // const currentData = await storage.getChannel(parseInt(channelId));
          const currentData = { id: channelId, ...req.body };
          
          backupControls.createBackup(currentData, `${operation}_before`);
          
          // Adicionar dados de backup ao request para uso posterior
          req.backupData = currentData;
        }
      }
      
      next();
    } catch (error) {
      console.error('[BACKUP_ERROR]', error);
      res.status(500).json({ error: 'Erro ao criar backup de segurança' });
    }
  };
};

// Middleware de verificação de integridade
export const integrityCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.method === 'POST' || req.method === 'PUT') {
      backupControls.verifyIntegrity(req.body);
    }
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: 'Falha na verificação de integridade',
      details: error.message 
    });
  }
};

// Middleware de auditoria
export const auditMiddleware = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da operação após resposta bem-sucedida
      if (res.statusCode < 400) {
        protectionMiddleware.auditLog(
          operation,
          req.params.id || 'new',
          req.user?.id || 'anonymous',
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body,
            method: req.method,
            url: req.originalUrl
          }
        );
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware combinado para proteção completa
export const fullProtectionMiddleware = (operation: string) => {
  return [
    validateChannelInput,
    rateLimitMiddleware(operation as any),
    autoBackupMiddleware(operation),
    integrityCheckMiddleware,
    auditMiddleware(operation)
  ];
};

// Estender Request interface para TypeScript
declare global {
  namespace Express {
    interface Request {
      backupData?: any;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}