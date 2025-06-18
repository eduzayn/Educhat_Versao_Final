import { UserAuthStorage } from './userAuthStorage';
import { UserSystemStorage } from './userSystemStorage';
import { UserSettingsStorage } from './userSettingsStorage';
import { UserRolesStorage } from './userRolesStorage';
import { UserAnalyticsStorage } from './userAnalyticsStorage';
import type { User, UpsertUser, SystemUser, InsertSystemUser, SystemSetting, Role, InsertRole } from '@shared/schema';

/**
 * Unified User Management Storage Module
 * Consolidates authentication, system users, settings and roles management
 * Replaces authStorage.ts and systemStorage.ts to eliminate duplication
 * 
 * REFACTORED VERSION: Now uses separate modules for better organization
 */
export class UserManagementStorage {
  public auth: UserAuthStorage;
  public system: UserSystemStorage;
  public settings: UserSettingsStorage;
  public roles: UserRolesStorage;
  public analytics: UserAnalyticsStorage;

  constructor() {
    this.auth = new UserAuthStorage();
    this.system = new UserSystemStorage();
    this.settings = new UserSettingsStorage();
    this.roles = new UserRolesStorage();
    this.analytics = new UserAnalyticsStorage();
  }

  // ==================== AUTHENTICATION OPERATIONS ====================
  
  /**
   * Get user by ID for authentication
   */
  async getUser(id: string): Promise<User | undefined> {
    return this.auth.getUser(id);
  }

  /**
   * Get user by ID (numeric version)
   */
  async getUserById(id: number): Promise<User | undefined> {
    return this.auth.getUserById(id);
  }

  /**
   * Get user by email for login
   */
  async getUserByEmail(email: string): Promise<SystemUser | undefined> {
    return this.auth.getUserByEmail(email);
  }

  /**
   * Create new user
   */
  async createUser(userData: any): Promise<User> {
    return this.auth.createUser(userData);
  }

  /**
   * Upsert user (create or update)
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    return this.auth.upsertUser(userData);
  }

  /**
   * Update user's last login timestamp
   */
  async updateUserLastLogin(userId: number): Promise<void> {
    return this.auth.updateUserLastLogin(userId);
  }

  // ==================== SYSTEM USERS MANAGEMENT ====================

  async getSystemUsers(): Promise<SystemUser[]> {
    return this.system.getSystemUsers();
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    return this.system.getSystemUser(id);
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    return this.system.createSystemUser(user);
  }

  async updateSystemUser(id: number, userData: Partial<InsertSystemUser>): Promise<SystemUser> {
    return this.system.updateSystemUser(id, userData);
  }

  async deleteSystemUser(id: number): Promise<void> {
    return this.system.deleteSystemUser(id);
  }

  async searchSystemUsers(query: string): Promise<SystemUser[]> {
    return this.system.searchSystemUsers(query);
  }

  async getAllUsers(): Promise<User[]> {
    return this.system.getAllUsers();
  }

  // ==================== SYSTEM SETTINGS ====================

  async getSystemSettings(): Promise<SystemSetting[]> {
    return this.settings.getSystemSettings();
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return this.settings.getSystemSetting(key);
  }

  async setSystemSetting(key: string, value: any): Promise<SystemSetting> {
    return this.settings.setSystemSetting(key, value);
  }

  async deleteSystemSetting(key: string): Promise<void> {
    return this.settings.deleteSystemSetting(key);
  }

  // ==================== ROLES MANAGEMENT ====================

  async getRoles(): Promise<Role[]> {
    return this.roles.getRoles();
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.getRole(id);
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    return this.roles.createRole(roleData);
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    return this.roles.updateRole(id, roleData);
  }

  async deleteRole(id: number): Promise<void> {
    return this.roles.deleteRole(id);
  }

  // ==================== PERMISSIONS & AUTHORIZATION ====================

  async checkUserPermission(userId: number, permission: string): Promise<boolean> {
    return this.roles.checkUserPermission(userId, permission);
  }

  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    return this.roles.canUserRespondToOthersConversations(userId);
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    return this.roles.canUserRespondToOwnConversations(userId);
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    return this.roles.canUserRespondToConversation(userId, conversationId);
  }

  // ==================== ANALYTICS METHODS (DELEGATED) ====================

  async getIntegrationAnalytics(integrationType: string, filters: any = {}) {
    return this.analytics.getIntegrationAnalytics(integrationType, filters);
  }

  async generateAnalyticsReport(reportType: string, filters: any = {}) {
    return this.analytics.generateAnalyticsReport(reportType, filters);
  }

  async sendAnalyticsReport(reportId: string, recipients: string[]) {
    return this.analytics.sendAnalyticsReport(reportId, recipients);
  }

  async exportAnalyticsData(exportType: string, filters: any = {}) {
    return this.analytics.exportAnalyticsData(exportType, filters);
  }

  async scheduleAnalyticsReport(schedule: any) {
    return this.analytics.scheduleAnalyticsReport(schedule);
  }

  async getScheduledReports(userId?: number) {
    return this.analytics.getScheduledReports(userId);
  }

  async deleteScheduledReport(reportId: string) {
    return this.analytics.deleteScheduledReport(reportId);
  }

  async executeCustomAnalyticsQuery(query: string, parameters?: any[]) {
    return this.analytics.executeCustomAnalyticsQuery(query, parameters);
  }

  async getRealtimeAnalytics(metric: string, filters?: any) {
    return this.analytics.getRealtimeAnalytics(metric, filters);
  }

  async getAnalyticsTrends(metric: string, timeframe: string, filters?: any) {
    return this.analytics.getAnalyticsTrends(metric, timeframe, filters);
  }

  async getAnalyticsAlerts(userId?: number) {
    return this.analytics.getAnalyticsAlerts(userId);
  }

  async createAnalyticsAlert(alertConfig: any) {
    return this.analytics.createAnalyticsAlert(alertConfig);
  }

  async updateAnalyticsAlert(alertId: string, alertConfig: any) {
    return this.analytics.updateAnalyticsAlert(alertId, alertConfig);
  }

  async deleteAnalyticsAlert(alertId: string) {
    return this.analytics.deleteAnalyticsAlert(alertId);
  }

  async getAnalyticsMetadata() {
    return this.analytics.getAnalyticsMetadata();
  }
} 