// DEPRECATED: Este módulo foi consolidado em userManagementStorage.ts
// Mantido para compatibilidade durante migração
import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, type User, type UpsertUser, type SystemUser, type InsertSystemUser } from "../../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Auth storage module - manages user authentication operations
 */
export class AuthStorage extends BaseStorage {
  /**
   * Get user by ID for authentication
   */
  async getUser(id: string): Promise<User | undefined> {
    const [systemUser] = await this.db.select().from(systemUsers).where(eq(systemUsers.id, parseInt(id)));
    if (!systemUser) return undefined;
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      teams: Array.isArray(systemUser.teamTypes) ? systemUser.teamTypes : [],
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  /**
   * Get user by ID (numeric version)
   */
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id.toString());
  }

  /**
   * Get user by email for login
   */
  async getUserByEmail(email: string): Promise<SystemUser | undefined> {
    const [systemUser] = await this.db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return systemUser;
  }

  /**
   * Create new user
   */
  async createUser(userData: UpsertUser): Promise<User> {
    const [systemUser] = await this.db
      .insert(systemUsers)
      .values({
        email: userData.email,
        username: userData.firstName || userData.email.split('@')[0],
        displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
        password: userData.password,
        role: userData.role || 'user',
        roleId: 1,
        isActive: true,
        channels: [],
        teams: []
      })
      .returning();
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      teams: Array.isArray(systemUser.teamTypes) ? systemUser.teamTypes : [],
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  /**
   * Upsert user (create or update)
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Update existing user
      const [updated] = await this.db
        .update(systemUsers)
        .set({
          username: userData.firstName || userData.email.split('@')[0],
          displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
          password: userData.password,
          role: userData.role || existingUser.role,
          updatedAt: new Date()
        })
        .where(eq(systemUsers.id, existingUser.id))
        .returning();
      
      return {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        roleId: updated.roleId || 1,
        dataKey: updated.dataKey || undefined,
        channels: Array.isArray(updated.channels) ? updated.channels : [],
        teamTypes: Array.isArray(updated.teamTypes) ? updated.teamTypes : [],
        teamId: updated.teamId || undefined,
        team: updated.team || undefined
      };
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }

  // System User operations
  async getSystemUsers(): Promise<SystemUser[]> {
    return this.db.select().from(systemUsers);
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await this.db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await this.db.insert(systemUsers).values(user).returning();
    return newUser;
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    const [updatedUser] = await this.db
      .update(systemUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteSystemUser(id: number): Promise<void> {
    await this.db.delete(systemUsers).where(eq(systemUsers.id, id));
  }

  // Additional methods required by storage interface
  async getAllUsers(): Promise<User[]> {
    const users = await this.db.select().from(systemUsers);
    return users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      roleId: user.roleId || 1,
      dataKey: user.dataKey || undefined,
      channels: Array.isArray(user.channels) ? user.channels : [],
      teams: Array.isArray(user.teams) ? user.teams : [],
      teamId: user.teamId || undefined,
      team: user.team || undefined
    }));
  }

  async updateUser(id: number, userData: Partial<UpsertUser>): Promise<User> {
    const [updated] = await this.db
      .update(systemUsers)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(systemUsers.id, id))
      .returning();

    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      displayName: updated.displayName,
      role: updated.role,
      roleId: updated.roleId || 1,
      dataKey: updated.dataKey || undefined,
      channels: Array.isArray(updated.channels) ? updated.channels : [],
      teams: Array.isArray(updated.teams) ? updated.teams : [],
      teamId: updated.teamId || undefined,
      team: updated.team || undefined
    };
  }

  async deleteUser(id: number): Promise<void> {
    await this.db.delete(systemUsers).where(eq(systemUsers.id, id));
  }

  async validateUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user || user.password !== password) {
      return undefined;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      roleId: user.roleId || 1,
      dataKey: user.dataKey || undefined,
      channels: Array.isArray(user.channels) ? user.channels : [],
      teams: Array.isArray(user.teams) ? user.teams : [],
      teamId: user.teamId || undefined,
      team: user.team || undefined
    };
  }
}