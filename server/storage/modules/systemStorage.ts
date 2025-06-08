import { BaseStorage } from "../base/BaseStorage";
import {
  systemUsers,
  systemSettings,
  type SystemUser,
  type InsertSystemUser,
  type SystemSetting,
  type InsertSystemSetting,
} from "@shared/schema";

/**
 * System storage module
 */
export class SystemStorage extends BaseStorage {
  // SystemUser operations
  async getSystemUsers(): Promise<SystemUser[]> {
    try {
      return await this.db
        .select()
        .from(systemUsers)
        .orderBy(this.desc(systemUsers.createdAt));
    } catch (error) {
      this.handleError(error, 'getSystemUsers');
    }
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    try {
      const [user] = await this.db
        .select()
        .from(systemUsers)
        .where(this.eq(systemUsers.id, id));
      return user;
    } catch (error) {
      this.handleError(error, 'getSystemUser');
    }
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    try {
      this.validateRequired(user, ['email', 'username'], 'createSystemUser');
      
      const [newUser] = await this.db
        .insert(systemUsers)
        .values(user)
        .returning();
      return newUser;
    } catch (error) {
      this.handleError(error, 'createSystemUser');
    }
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    try {
      const [updatedUser] = await this.db
        .update(systemUsers)
        .set({ ...user, updatedAt: new Date() })
        .where(this.eq(systemUsers.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      this.handleError(error, 'updateSystemUser');
    }
  }

  async deleteSystemUser(id: number): Promise<void> {
    try {
      await this.db
        .delete(systemUsers)
        .where(this.eq(systemUsers.id, id));
    } catch (error) {
      this.handleError(error, 'deleteSystemUser');
    }
  }

  // SystemSettings operations
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    try {
      const [setting] = await this.db
        .select()
        .from(systemSettings)
        .where(this.eq(systemSettings.key, key));
      return setting || null;
    } catch (error) {
      this.handleError(error, 'getSystemSetting');
    }
  }

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    try {
      if (category) {
        return await this.db
          .select()
          .from(systemSettings)
          .where(this.eq(systemSettings.category, category))
          .orderBy(systemSettings.key);
      }
      
      return await this.db
        .select()
        .from(systemSettings)
        .orderBy(systemSettings.category, systemSettings.key);
    } catch (error) {
      this.handleError(error, 'getSystemSettings');
    }
  }

  async setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting> {
    try {
      this.validateRequired({ key, value }, ['key', 'value'], 'setSystemSetting');
      
      const [setting] = await this.db
        .insert(systemSettings)
        .values({
          key,
          value,
          type: type || 'string',
          description,
          category: category || 'general'
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            type: type || 'string',
            description,
            category: category || 'general',
            updatedAt: new Date()
          }
        })
        .returning();
      
      return setting;
    } catch (error) {
      this.handleError(error, 'setSystemSetting');
    }
  }

  async toggleSystemSetting(key: string): Promise<SystemSetting> {
    try {
      const currentSetting = await this.getSystemSetting(key);
      
      if (!currentSetting) {
        return await this.setSystemSetting(key, 'false', 'boolean');
      }
      
      const currentValue = currentSetting.value?.toLowerCase() === 'true';
      const newValue = (!currentValue).toString();
      
      return await this.setSystemSetting(
        key, 
        newValue, 
        'boolean', 
        currentSetting.description ? currentSetting.description : undefined, 
        currentSetting.category ? currentSetting.category : undefined
      );
    } catch (error) {
      this.handleError(error, 'toggleSystemSetting');
    }
  }

  async deleteSystemSetting(key: string): Promise<void> {
    try {
      await this.db
        .delete(systemSettings)
        .where(this.eq(systemSettings.key, key));
    } catch (error) {
      this.handleError(error, 'deleteSystemSetting');
    }
  }
}