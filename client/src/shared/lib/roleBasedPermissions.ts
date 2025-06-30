/**
 * Sistema simplificado de permissões baseado em funções
 * Implementação paralela ao sistema granular existente
 */

export type UserRole = 'admin' | 'superadmin' | 'gerente' | 'atendente' | 'Administrador' | 'Gerente';

// Páginas que cada perfil pode acessar
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // Administrador: Acesso total
  admin: [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/reports',
    '/bi',
    '/chat-interno',
    '/profile',
    '/settings',
    '/settings/users',
    '/settings/channels',
    '/settings/quick-replies',
    '/settings/webhooks',
    '/settings/ai-detection',
    '/admin/permissions',
    '/integrations',
    '/integrations/facebook',
    '/integrations/manychat',
    '/teams',
    '/teams/transfer'
  ],
  
  // Superadmin: Acesso total (igual admin)
  superadmin: [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/reports',
    '/bi',
    '/chat-interno',
    '/profile',
    '/settings',
    '/settings/users',
    '/settings/channels',
    '/settings/quick-replies',
    '/settings/webhooks',
    '/settings/ai-detection',
    '/admin/permissions',
    '/integrations',
    '/integrations/facebook',
    '/integrations/manychat',
    '/teams',
    '/teams/transfer'
  ],
  
  // Gerente: Páginas operacionais + relatórios + configurações básicas
  gerente: [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/reports',
    '/bi',
    '/chat-interno',
    '/profile',
    '/settings/quick-replies',
    '/settings/channels',
    '/teams',
    '/teams/transfer'
  ],
  
  // Atendente: Apenas páginas operacionais básicas
  atendente: [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/chat-interno',
    '/profile',
    '/settings/quick-replies'
  ],

  // Administrador (com maiúscula): Acesso total igual admin
  'Administrador': [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/reports',
    '/bi',
    '/chat-interno',
    '/profile',
    '/settings',
    '/settings/users',
    '/settings/channels',
    '/settings/quick-replies',
    '/settings/webhooks',
    '/settings/ai-detection',
    '/admin/permissions',
    '/integrations',
    '/integrations/facebook',
    '/integrations/manychat',
    '/teams',
    '/teams/transfer'
  ],

  // Gerente (com maiúscula): Páginas operacionais + relatórios + configurações básicas
  'Gerente': [
    '/',
    '/inbox',
    '/contacts',
    '/crm',
    '/reports',
    '/bi',
    '/chat-interno',
    '/profile',
    '/settings/quick-replies',
    '/settings/channels',
    '/teams',
    '/teams/transfer'
  ]
};

/**
 * Verifica se o usuário tem acesso a uma página específica baseado em sua função
 */
export function hasRoleBasedAccess(userRole: string | undefined, pagePath: string): boolean {
  if (!userRole) return false;
  
  // Primeiro tenta usar o role exato como está no banco
  let allowedPaths = ROLE_PERMISSIONS[userRole as UserRole];
  
  // Se não encontrou, tenta com minúscula (compatibilidade com sistema antigo)
  if (!allowedPaths) {
    const roleLowerCase = userRole.toLowerCase() as UserRole;
    allowedPaths = ROLE_PERMISSIONS[roleLowerCase];
  }
  
  // Se ainda não encontrou, não tem permissões
  if (!allowedPaths) return false;
  
  // Verifica acesso exato
  if (allowedPaths.includes(pagePath)) return true;
  
  // Verifica se é uma subpágina de uma página permitida
  return allowedPaths.some(allowedPath => {
    if (allowedPath === '/') return false; // Root não deve dar acesso a subpáginas
    return pagePath.startsWith(allowedPath + '/');
  });
}

/**
 * Obtém todas as páginas que um usuário pode acessar
 */
export function getAllowedPagesForRole(userRole: string | undefined): string[] {
  if (!userRole) return [];
  
  // Primeiro tenta usar o role exato como está no banco
  let allowedPaths = ROLE_PERMISSIONS[userRole as UserRole];
  
  // Se não encontrou, tenta com minúscula (compatibilidade com sistema antigo)
  if (!allowedPaths) {
    const roleLowerCase = userRole.toLowerCase() as UserRole;
    allowedPaths = ROLE_PERMISSIONS[roleLowerCase];
  }
  
  return allowedPaths || [];
}

/**
 * Verifica se o usuário é administrador (admin, superadmin ou Administrador)
 */
export function isAdminRole(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ['admin', 'superadmin', 'Administrador'].includes(userRole);
}

/**
 * Verifica se o usuário é gerente ou superior
 */
export function isManagerOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ['admin', 'superadmin', 'gerente', 'Administrador', 'Gerente'].includes(userRole);
}

/**
 * Hook para usar o sistema de permissões baseado em funções
 */
import { useAuth } from './hooks/useAuth';

export function useRoleBasedPermissions() {
  const { user } = useAuth();
  
  // Função helper para extrair role com segurança
  const getUserRole = (userData: unknown): string | undefined => {
    if (!userData || typeof userData !== 'object') return undefined;
    if ('role' in userData && typeof (userData as any).role === 'string') {
      return (userData as any).role;
    }
    return undefined;
  };
  
  const userRole = getUserRole(user);
  
  return {
    hasAccess: (pagePath: string) => hasRoleBasedAccess(userRole, pagePath),
    isAdmin: () => isAdminRole(userRole),
    isManagerOrAbove: () => isManagerOrAbove(userRole),
    allowedPages: getAllowedPagesForRole(userRole),
    userRole
  };
}