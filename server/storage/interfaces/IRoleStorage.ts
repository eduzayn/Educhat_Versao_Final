import { Role, InsertRole } from '@shared/schema';

export interface IRoleStorage {
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  checkUserPermission(userId: number, permissionName: string): Promise<boolean>;
} 