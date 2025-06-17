import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, systemSettings, roles, type User, type UpsertUser, type SystemUser, type InsertSystemUser, type SystemSetting, type InsertSystemSetting, type Role, type InsertRole } from "@shared/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

/**
 * Unified User Management Storage Module
 * Consolidates authentication, system users, settings and roles management
 * Replaces authStorage.ts and systemStorage.ts to eliminate duplication
 */
export class UserManagementStorage extends BaseStorage {
  // ==================== AUTHENTICATION OPERATIONS ====================
  
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

  // ==================== SYSTEM USERS MANAGEMENT ====================

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

  // ==================== SYSTEM SETTINGS ====================

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

  // ==================== ROLES MANAGEMENT ====================

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

  // ==================== ANALYTICS METHODS (DELEGATED) ====================

  async getIntegrationAnalytics(integrationType: string, filters: any = {}) {
    // Placeholder for integration analytics
    return {
      integration: integrationType,
      metrics: {
        totalRequests: 0,
        successRate: 0,
        errorRate: 0,
        averageResponseTime: 0
      },
      filters
    };
  }

  async generateAnalyticsReport(reportType: string, filters: any = {}) {
    return {
      reportId: `${reportType}_${Date.now()}`,
      type: reportType,
      generatedAt: new Date(),
      filters,
      data: {}
    };
  }

  async sendAnalyticsReport(reportId: string, recipients: string[]) {
    return { success: true, reportId, recipients };
  }

  async exportAnalyticsData(exportType: string, filters: any = {}) {
    return {
      exportId: `export_${Date.now()}`,
      type: exportType,
      filters,
      downloadUrl: null
    };
  }

  async scheduleAnalyticsReport(schedule: any) {
    return {
      scheduleId: `schedule_${Date.now()}`,
      schedule,
      active: true
    };
  }

  async getScheduledReports(userId?: number) {
    return [];
  }

  async deleteScheduledReport(reportId: string) {
    return { success: true };
  }

  async executeCustomAnalyticsQuery(query: string, parameters?: any[]) {
    return { results: [], query, parameters };
  }

  async getRealtimeAnalytics(metric: string, filters?: any) {
    return { metric, value: 0, timestamp: new Date(), filters };
  }

  async getAnalyticsTrends(metric: string, timeframe: string, filters?: any) {
    return {
      metric,
      timeframe,
      trends: [],
      filters
    };
  }

  async getAnalyticsAlerts(userId?: number) {
    return [];
  }

  async createAnalyticsAlert(alertConfig: any) {
    return {
      alertId: `alert_${Date.now()}`,
      config: alertConfig,
      active: true
    };
  }

  async updateAnalyticsAlert(alertId: string, alertConfig: any) {
    return { success: true, alertId, config: alertConfig };
  }

  async deleteAnalyticsAlert(alertId: string) {
    return { success: true };
  }

  async getAnalyticsMetadata() {
    return {
      availableMetrics: [],
      dimensions: [],
      filters: []
    };
  }
}