import { useQuery } from '@tanstack/react-query';

export interface UserPermissions {
  isAdmin: boolean;
  rolePermissions: Array<{
    id: number;
    name: string;
    resource: string;
    action: string;
    description: string;
    category: string;
  }>;
  customPermissions: Array<{
    id: number;
    name: string;
    resource: string;
    action: string;
    description: string;
    category: string;
    conditions: any;
  }>;
  user: {
    id: number;
    role: string;
    dataKey?: string;
    channels: string[];
    macrosetores: string[];
  };
}

/**
 * Hook para buscar permissões do usuário atual
 */
export function useUserPermissions() {
  return useQuery<UserPermissions>({
    queryKey: ['/api/admin/user-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-permissions');
      if (!response.ok) throw new Error('Failed to fetch user permissions');
      return response.json();
    },
  });
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(
  userPermissions: UserPermissions | undefined,
  permissionName: string
): boolean {
  if (!userPermissions) return false;
  
  // Admin tem todas as permissões
  if (userPermissions.isAdmin) return true;
  
  // Verificar permissões da função
  const hasRolePermission = userPermissions.rolePermissions.some(
    p => p.name === permissionName
  );
  
  if (hasRolePermission) return true;
  
  // Verificar permissões customizadas
  const hasCustomPermission = userPermissions.customPermissions.some(
    p => p.name === permissionName
  );
  
  return hasCustomPermission;
}

/**
 * Verifica se o usuário tem pelo menos uma das permissões especificadas
 */
export function hasAnyPermission(
  userPermissions: UserPermissions | undefined,
  permissionNames: string[]
): boolean {
  return permissionNames.some(permission => 
    hasPermission(userPermissions, permission)
  );
}

/**
 * Verifica se o usuário tem todas as permissões especificadas
 */
export function hasAllPermissions(
  userPermissions: UserPermissions | undefined,
  permissionNames: string[]
): boolean {
  return permissionNames.every(permission => 
    hasPermission(userPermissions, permission)
  );
}

/**
 * Hook para verificar permissão específica
 */
export function useHasPermission(permissionName: string) {
  const { data: userPermissions } = useUserPermissions();
  return hasPermission(userPermissions, permissionName);
}

/**
 * Hook para verificar múltiplas permissões
 */
export function useHasAnyPermission(permissionNames: string[]) {
  const { data: userPermissions } = useUserPermissions();
  return hasAnyPermission(userPermissions, permissionNames);
}

/**
 * Hook para verificar se é admin
 */
export function useIsAdmin() {
  const { data: userPermissions } = useUserPermissions();
  return userPermissions?.isAdmin || false;
}

/**
 * Componente para renderizar conteúdo baseado em permissões
 */
interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: PermissionGateProps) {
  const { data: userPermissions } = useUserPermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(userPermissions, permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(userPermissions, permissions)
      : hasAnyPermission(userPermissions, permissions);
  }
  
  return hasAccess ? children : fallback;
}

/**
 * Verifica se o usuário pode editar um negócio específico
 * Atendentes só podem editar seus próprios negócios
 */
export function canEditDeal(
  userPermissions: UserPermissions | undefined,
  deal: { assignedUserId?: number; createdByUserId?: number },
  currentUserId?: number
): boolean {
  if (!userPermissions || !currentUserId) return false;
  
  // Admin sempre pode editar
  if (userPermissions.isAdmin) return true;
  
  // Verificar se tem permissão geral
  const hasGeneralPermission = hasPermission(userPermissions, 'editar:negocio');
  if (!hasGeneralPermission) return false;
  
  // Para roles superiores (não atendente), permitir editar qualquer negócio
  const userRole = userPermissions.rolePermissions?.[0]?.name || '';
  const isSuperiorRole = ['admin', 'manager', 'supervisor'].some(role => 
    userRole.toLowerCase().includes(role)
  );
  
  if (isSuperiorRole) return true;
  
  // Para atendentes, só permitir editar negócios atribuídos a eles ou criados por eles
  return deal.assignedUserId === currentUserId || deal.createdByUserId === currentUserId;
}

/**
 * Verifica se o usuário pode excluir um negócio específico
 * Atendentes só podem excluir seus próprios negócios
 */
export function canDeleteSpecificDeal(
  userPermissions: UserPermissions | undefined,
  deal: { assignedUserId?: number; createdByUserId?: number },
  currentUserId?: number
): boolean {
  if (!userPermissions || !currentUserId) return false;
  
  // Admin sempre pode excluir
  if (userPermissions.isAdmin) return true;
  
  // Verificar se tem permissão geral
  const hasGeneralPermission = hasPermission(userPermissions, 'excluir:negocio');
  if (!hasGeneralPermission) return false;
  
  // Para roles superiores (não atendente), permitir excluir qualquer negócio
  const userRole = userPermissions.rolePermissions?.[0]?.name || '';
  const isSuperiorRole = ['admin', 'manager', 'supervisor'].some(role => 
    userRole.toLowerCase().includes(role)
  );
  
  if (isSuperiorRole) return true;
  
  // Para atendentes, só permitir excluir negócios criados por eles
  return deal.createdByUserId === currentUserId;
}