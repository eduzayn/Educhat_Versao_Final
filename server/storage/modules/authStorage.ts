import { BaseStorage } from "../base/BaseStorage";
import {
  systemUsers,
  type User,
  type UpsertUser,
  type SystemUser,
} from "../../../shared/schema";

/**
 * Authentication storage module
 */
export class AuthStorage extends BaseStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [systemUser] = await this.db.select().from(systemUsers).where(this.eq(systemUsers.id, parseInt(id)));
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
        macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
        teamId: systemUser.teamId || undefined,
        team: systemUser.team || undefined
      };
    } catch (error) {
      this.handleError(error, 'getUser');
    }
  }

  async getUserByEmail(email: string): Promise<SystemUser | undefined> {
    try {
      this.validateRequired({ email }, ['email'], 'getUserByEmail');
      const [systemUser] = await this.db.select().from(systemUsers).where(this.eq(systemUsers.email, email));
      return systemUser;
    } catch (error) {
      this.handleError(error, 'getUserByEmail');
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    try {
      this.validateRequired(userData, ['email'], 'createUser');
      
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
          macrosetores: []
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
        macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
        teamId: systemUser.teamId || undefined,
        team: systemUser.team || undefined
      };
    } catch (error) {
      this.handleError(error, 'createUser');
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      this.validateRequired(userData, ['email'], 'upsertUser');
      
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
          macrosetores: []
        })
        .onConflictDoUpdate({
          target: systemUsers.email,
          set: {
            displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
            updatedAt: new Date(),
          },
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
        macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
        teamId: systemUser.teamId || undefined,
        team: systemUser.team || undefined
      };
    } catch (error) {
      this.handleError(error, 'upsertUser');
    }
  }
}