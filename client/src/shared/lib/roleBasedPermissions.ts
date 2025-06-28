/**
 * Sistema simplificado de permissões baseado em funções
 * Implementação paralela ao sistema granular existente
 */

export type UserRole = 'admin' | 'superadmin' | 'gerente' | 'atendente';

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
  ]
};

/**
 * Verifica se o usuário tem acesso a uma página específica baseado em sua função
 */
export function hasRoleBasedAccess(userRole: string | undefined, pagePath: string): boolean {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase() as UserRole;
  const allowedPaths = ROLE_PERMISSIONS[role] || [];
  
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
  
  const role = userRole.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Verifica se o usuário é administrador (admin ou superadmin)
 */
export function isAdminRole(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ['admin', 'superadmin'].includes(userRole.toLowerCase());
}

/**
 * Verifica se o usuário é gerente ou superior
 */
export function isManagerOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ['admin', 'superadmin', 'gerente'].includes(userRole.toLowerCase());
}

/**
 * Hook para usar o sistema de permissões baseado em funções
 */
import { useAuth } from './hooks/useAuth';

export function useRoleBasedPermissions() {
  const { user } = useAuth();
  
  return {
    hasAccess: (pagePath: string) => hasRoleBasedAccess(user?.role, pagePath),
    isAdmin: () => isAdminRole(user?.role),
    isManagerOrAbove: () => isManagerOrAbove(user?.role),
    allowedPages: getAllowedPagesForRole(user?.role),
    userRole: user?.role
  };
}