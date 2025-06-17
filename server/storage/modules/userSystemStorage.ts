import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, type User, type SystemUser, type InsertSystemUser } from "@shared/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

/**
 * User System Management Storage Module
 * Handles system user management operations
 */
export class UserSystemStorage extends BaseStorage {

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

  async getAllUsers(): Promise<User[]> {
    const users = await this.db.select().from(systemUsers).where(eq(systemUsers.isActive, true));
    return users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      roleId: user.roleId || 1,
      dataKey: user.dataKey || undefined,
      channels: Array.isArray(user.channels) ? user.channels : [],
      teams: Array.isArray(user.teamTypes) ? user.teamTypes : [],
      teamId: user.teamId || undefined,
      team: user.team || undefined
    }));
  }
} 