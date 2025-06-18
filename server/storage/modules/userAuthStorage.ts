import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, type User, type UpsertUser, type SystemUser } from "../../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * User Authentication Storage Module
 * Handles user authentication operations
 */
export class UserAuthStorage extends BaseStorage {
  
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
  async createUser(userData: any): Promise<User> {
    const [systemUser] = await this.db
      .insert(systemUsers)
      .values({
        email: userData.email,
        username: userData.username || userData.firstName || userData.email.split('@')[0],
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
        password: userData.password,
        role: userData.role || 'user',
        roleId: userData.roleId || 1,
        team: userData.team || null,
        teamId: userData.teamId || null,
        isActive: true,
        channels: [],
        teamTypes: []
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
        teams: Array.isArray(updated.teamTypes) ? updated.teamTypes : [],
        teamId: updated.teamId || undefined,
        team: updated.team || undefined
      };
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateUserLastLogin(userId: number): Promise<void> {
    await this.db.update(systemUsers)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(systemUsers.id, userId));
  }
} 