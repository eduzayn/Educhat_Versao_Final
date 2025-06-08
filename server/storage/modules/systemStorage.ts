import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, systemSettings, roles, type SystemUser, type InsertSystemUser, type SystemSetting, type InsertSystemSetting, type Role, type InsertRole } from "../../../shared/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

/**
 * System storage module - manages system users, settings and roles
 */
export class SystemStorage extends BaseStorage {
  // ==================== SYSTEM USERS ====================
  async getSystemUsers(): Promise<SystemUser[]> {
    return this.db.select().from(systemUsers).orderBy(desc(systemUsers.createdAt));
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await this.db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await this.db.insert(systemUsers).values(user).returning();
    return newUser;
  }

  async updateSystemUser(id: number, userData: Partial<InsertSystemUser>): Promise<SystemUser> {
    const [updated] = await this.db.update(systemUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return updated;
  }

  async deleteSystemUser(id: number): Promise<void> {
    await this.db.update(systemUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(systemUsers.id, id));
  }

  async searchSystemUsers(query: string): Promise<SystemUser[]> {
    return this.db.select().from(systemUsers)
      .where(
        or(
          ilike(systemUsers.username, `%${query}%`),
          ilike(systemUsers.displayName, `%${query}%`),
          ilike(systemUsers.email, `%${query}%`)
        )
      )
      .orderBy(desc(systemUsers.createdAt));
  }

  // ==================== SYSTEM SETTINGS ====================
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    const [setting] = await this.db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || null;
  }

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return this.db.select().from(systemSettings)
        .where(eq(systemSettings.category, category))
        .orderBy(systemSettings.key);
    }
    return this.db.select().from(systemSettings).orderBy(systemSettings.key);
  }

  async setSystemSetting(
    key: string, 
    value: string, 
    type = "string", 
    description?: string, 
    category = "general"
  ): Promise<SystemSetting> {
    const existingSetting = await this.getSystemSetting(key);
    
    if (existingSetting) {
      const [updated] = await this.db.update(systemSettings)
        .set({ 
          value, 
          type,
          description: description || existingSetting.description,
          category: category || existingSetting.category,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    }

    const [newSetting] = await this.db.insert(systemSettings)
      .values({ key, value, type, description, category })
      .returning();
    return newSetting;
  }

  async toggleSystemSetting(key: string): Promise<SystemSetting> {
    const setting = await this.getSystemSetting(key);
    if (!setting) {
      throw new Error(`Setting ${key} not found`);
    }

    const newValue = setting.value === "true" ? "false" : "true";
    return this.setSystemSetting(key, newValue, "boolean", setting.description ?? undefined, setting.category ?? undefined);
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // ==================== ROLES ====================
  async getRoles(): Promise<Role[]> {
    return this.db.select().from(roles).orderBy(desc(roles.createdAt));
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await this.db.insert(roles).values(role).returning();
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
    await this.db.update(roles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(roles.id, id));
  }

  // ==================== PERMISSION HELPERS ====================
  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    const user = await this.getSystemUser(userId);
    if (!user) return false;
    
    // Basic role-based permission check - can be expanded with proper RBAC
    return user.role === 'admin' || user.role === 'gerente' || user.role === 'supervisor';
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    const user = await this.getSystemUser(userId);
    return user?.isActive || false;
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    // Basic implementation - can be expanded with conversation ownership checks
    return this.canUserRespondToOthersConversations(userId);
  }
}