import { BaseStorage } from "../base/BaseStorage";
import { roles, type Role, type InsertRole } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * User Roles Storage Module
 * Handles roles and permissions management
 */
export class UserRolesStorage extends BaseStorage {

  async getRoles(): Promise<Role[]> {
    return this.db.select().from(roles).orderBy(desc(roles.createdAt));
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [newRole] = await this.db.insert(roles).values(roleData).returning();
    return newRole;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [updated] = await this.db.update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  }

  async deleteRole(id: number): Promise<void> {
    await this.db.delete(roles).where(eq(roles.id, id));
  }

  // ==================== PERMISSIONS & AUTHORIZATION ====================

  async checkUserPermission(userId: number, permission: string): Promise<boolean> {
    const user = await this.getSystemUser(userId);
    if (!user || !user.roleId) return false;

    const role = await this.getRole(user.roleId);
    if (!role || !role.permissions) return false;

    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    return permissions.includes(permission);
  }

  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    return this.checkUserPermission(userId, 'conversations.respond_others');
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    return this.checkUserPermission(userId, 'conversations.respond_own');
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    // Para simplificar, permitir que usuários respondam a todas as conversas
    // Em uma implementação mais robusta, seria necessário verificar se o usuário
    // tem permissão para responder à conversa específica
    return this.canUserRespondToOthersConversations(userId);
  }

  // Método auxiliar para acessar systemUsers (necessário para checkUserPermission)
  private async getSystemUser(userId: number): Promise<any> {
    // Importação dinâmica para evitar dependência circular
    const { UserSystemStorage } = await import('./userSystemStorage');
    const userSystemStorage = new UserSystemStorage();
    return userSystemStorage.getSystemUser(userId);
  }
} 