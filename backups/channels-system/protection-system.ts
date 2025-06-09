/**
 * Sistema de Proteção para Configurações de Canais
 * Implementa validações e controles de segurança
 */

// Validações de segurança para canais
export const channelValidations = {
  // Validar dados do canal antes de criar/atualizar
  validateChannelData: (data: any) => {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome do canal deve ter pelo menos 2 caracteres');
    }
    
    if (!data.instanceId || !/^[A-F0-9]{32}$/.test(data.instanceId)) {
      errors.push('Instance ID deve ter formato válido (32 caracteres hexadecimais)');
    }
    
    if (!data.token || data.token.length < 20) {
      errors.push('Token deve ter pelo menos 20 caracteres');
    }
    
    if (!data.clientToken || data.clientToken.length < 20) {
      errors.push('Client Token deve ter pelo menos 20 caracteres');
    }
    
    if (data.webhookUrl && !isValidUrl(data.webhookUrl)) {
      errors.push('URL do webhook deve ser válida');
    }
    
    return errors;
  },
  
  // Verificar se canal já existe antes de criar
  checkDuplicate: async (instanceId: string, existingChannels: any[]) => {
    return existingChannels.some(channel => channel.instanceId === instanceId);
  }
};

// Controles de backup automático
export const backupControls = {
  // Criar backup antes de alterações críticas
  createBackup: (channelData: any, operation: string) => {
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      operation,
      data: channelData,
      user: 'system' // Pode ser substituído por dados do usuário autenticado
    };
    
    console.log(`[BACKUP] ${operation} - Canal ${channelData.name}:`, backupData);
    return backupData;
  },
  
  // Verificar integridade dos dados
  verifyIntegrity: (data: any) => {
    const requiredFields = ['name', 'type', 'instanceId', 'token', 'clientToken'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
};

// Middleware de proteção para rotas
export const protectionMiddleware = {
  // Validar permissões antes de operações sensíveis
  validatePermissions: (req: any, res: any, next: any) => {
    // Implementar validação de permissões baseada em role
    const userRole = req.user?.role || 'guest';
    const allowedRoles = ['admin', 'manager'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado - Permissões insuficientes para gerenciar canais' 
      });
    }
    
    next();
  },
  
  // Log de auditoria para operações
  auditLog: (operation: string, channelId: string, userId: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      channelId,
      userId,
      details,
      ip: details.ip || 'unknown'
    };
    
    console.log('[AUDIT]', logEntry);
    // Aqui poderia salvar no banco de dados na tabela audit_logs
    return logEntry;
  }
};

// Utilitários de validação
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return string.startsWith('http://') || string.startsWith('https://');
  } catch (_) {
    return false;
  }
}

// Configurações de segurança
export const securityConfig = {
  // Limites de operações por período
  rateLimits: {
    channelCreation: { max: 5, window: 3600000 }, // 5 canais por hora
    qrGeneration: { max: 10, window: 600000 }, // 10 QR codes por 10 minutos
    connectionTests: { max: 20, window: 3600000 } // 20 testes por hora
  },
  
  // Configurações de timeout
  timeouts: {
    zapiConnection: 10000, // 10 segundos
    qrGeneration: 15000, // 15 segundos
    webhookResponse: 5000 // 5 segundos
  },
  
  // Validações de entrada
  inputSanitization: {
    maxNameLength: 50,
    maxDescriptionLength: 200,
    allowedTypes: ['whatsapp', 'support'],
    forbiddenChars: ['<', '>', '"', "'", '&']
  }
};