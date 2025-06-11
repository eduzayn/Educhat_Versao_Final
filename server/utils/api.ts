/**
 * Utilitários de API - Consolidação de funções de API dispersas
 */

/**
 * Cria resposta padronizada de sucesso
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message: message || 'Operação realizada com sucesso'
  };
}

/**
 * Cria resposta padronizada de erro
 */
export function createErrorResponse(error: string, code?: number) {
  return {
    success: false,
    error,
    code: code || 500
  };
}

/**
 * Extrai parâmetros de paginação da query
 */
export function extractPaginationParams(query: any) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Máximo 100 itens
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Cria resposta paginada
 */
export function createPaginatedResponse(data: any[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * Valida se o usuário tem permissão para acessar o recurso
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3,
    'manager': 2,
    'agent': 1,
    'viewer': 0
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Sanitiza dados de entrada removendo campos perigosos
 */
export function sanitizeInput(data: any, allowedFields: string[]): any {
  const sanitized: any = {};
  
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}

/**
 * Gera ID único para requisições
 */
export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}