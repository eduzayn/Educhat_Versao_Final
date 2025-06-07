/**
 * Utilitários para sistema de permissões reutilizáveis
 */

export interface Permission {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  displayName?: string;
  permissions: Permission[];
  isActive?: boolean;
}

// Helper para renderizar badges de permissões
export const renderPermissionBadges = (permissions: Permission[], maxVisible = 3) => {
  const visiblePermissions = permissions.slice(0, maxVisible);
  const remainingCount = permissions.length - maxVisible;
  
  return {
    visiblePermissions,
    remainingCount: remainingCount > 0 ? remainingCount : 0,
    hasMore: remainingCount > 0
  };
};

// Helper para filtrar permissões por categoria
export const filterPermissionsByCategory = (permissions: Permission[], category?: string) => {
  if (!category || category === 'all') {
    return permissions;
  }
  
  return permissions.filter(permission => 
    permission.name.toLowerCase().includes(category.toLowerCase())
  );
};

// Helper para validar se usuário tem permissão específica
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
};

// Helper para agrupar permissões por módulo
export const groupPermissionsByModule = (permissions: Permission[]) => {
  const groups: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    const module = permission.name.split('_')[0] || 'other';
    if (!groups[module]) {
      groups[module] = [];
    }
    groups[module].push(permission);
  });
  
  return groups;
};

// Helper para status de função
export const getRoleStatusBadge = (role: Role) => {
  return {
    variant: role.isActive ? 'default' : 'secondary',
    text: role.isActive ? 'Ativa' : 'Inativa',
    color: role.isActive ? 'text-green-700' : 'text-gray-700'
  };
};

// Configurações de módulos do sistema
export const SYSTEM_MODULES = {
  users: { name: 'Usuários', icon: 'Users' },
  roles: { name: 'Funções', icon: 'Shield' },
  permissions: { name: 'Permissões', icon: 'Lock' },
  channels: { name: 'Canais', icon: 'MessageSquare' },
  conversations: { name: 'Conversas', icon: 'MessageCircle' },
  contacts: { name: 'Contatos', icon: 'User' },
  reports: { name: 'Relatórios', icon: 'BarChart' },
  settings: { name: 'Configurações', icon: 'Settings' }
};