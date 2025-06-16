import { eq } from 'drizzle-orm';
import { db } from '../../../core/db';
import { systemUsers, roles } from '../../../../shared/schema';
import { UserPermissions } from '../types/teams';

export async function getUserPermissions(userId: number): Promise<UserPermissions> {
  const userWithRole = await db
    .select({
      id: systemUsers.id,
      username: systemUsers.username,
      displayName: systemUsers.displayName,
      roleId: systemUsers.roleId,
      roleName: roles.name
    })
    .from(systemUsers)
    .leftJoin(roles, eq(systemUsers.roleId, roles.id))
    .where(eq(systemUsers.id, userId))
    .limit(1);
  
  if (!userWithRole[0]) {
    return { canViewAll: false, canViewTeams: false, canViewPrivate: false, isAdmin: false, isManager: false, user: null as any };
  }
  
  const roleName = userWithRole[0].roleName || '';
  const isAdmin = roleName === 'Administrador' || roleName === 'Admin';
  const isManager = roleName === 'Gerente' || roleName === 'Gestor';
  
  return {
    canViewAll: isAdmin || isManager,
    canViewTeams: true,
    canViewPrivate: isAdmin || isManager,
    isAdmin,
    isManager,
    user: userWithRole[0]
  };
} 