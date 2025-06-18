import { SystemSetting, InsertSystemSetting } from '@shared/schema';

export interface ISystemSettingStorage {
  getSystemSetting(key: string): Promise<SystemSetting | null>;
  getSystemSettings(category?: string): Promise<SystemSetting[]>;
  setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting>;
  toggleSystemSetting(key: string): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;
} 