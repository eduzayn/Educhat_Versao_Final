import { BaseStorage } from "../base/BaseStorage";
import { systemSettings, type SystemSetting } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * User Settings Storage Module
 * Handles system settings management
 */
export class UserSettingsStorage extends BaseStorage {

  async getSystemSettings(): Promise<SystemSetting[]> {
    return this.db.select().from(systemSettings).orderBy(desc(systemSettings.updatedAt));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await this.db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async setSystemSetting(key: string, value: any): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const [updated] = await this.db.update(systemSettings)
        .set({ value: JSON.stringify(value), updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await this.db.insert(systemSettings)
        .values({ key, value: JSON.stringify(value) })
        .returning();
      return created;
    }
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
  }
} 