import { BaseStorage } from '../base/BaseStorage';
import { 
  manychatIntegrations, 
  manychatWebhookLogs,
  type ManychatIntegration, 
  type InsertManychatIntegration,
  type ManychatWebhookLog,
  type InsertManychatWebhookLog
} from '../../../shared/schema';
import { ManychatIntegrationOperations } from './manychatIntegrationOperations';
import { ManychatWebhookLogOperations } from './manychatWebhookLogOperations';
import { ManychatApiOperations } from './manychatApiOperations';
import { ManychatLeadProcessing } from './manychatLeadProcessing';

/**
 * ManyChat storage module - manages ManyChat integration data
 */
export class ManychatStorage extends BaseStorage {
  private integrationOps: ManychatIntegrationOperations;
  private webhookLogOps: ManychatWebhookLogOperations;
  private apiOps: ManychatApiOperations;
  private leadProcessing: ManychatLeadProcessing;

  constructor() {
    super();
    this.integrationOps = new ManychatIntegrationOperations();
    this.webhookLogOps = new ManychatWebhookLogOperations();
    this.apiOps = new ManychatApiOperations();
    this.leadProcessing = new ManychatLeadProcessing();
  }
  
  // Integrations management
  async getIntegrations(): Promise<ManychatIntegration[]> {
    return this.integrationOps.getIntegrations();
  }

  async getIntegration(id: number): Promise<ManychatIntegration | undefined> {
    return this.integrationOps.getIntegration(id);
  }

  async getActiveIntegration(): Promise<ManychatIntegration | undefined> {
    return this.integrationOps.getActiveIntegration();
  }

  async createIntegration(integration: InsertManychatIntegration): Promise<ManychatIntegration> {
    return this.integrationOps.createIntegration(integration);
  }

  async updateIntegration(id: number, updates: Partial<InsertManychatIntegration>): Promise<ManychatIntegration> {
    return this.integrationOps.updateIntegration(id, updates);
  }

  async deleteIntegration(id: number): Promise<void> {
    return this.integrationOps.deleteIntegration(id);
  }

  async updateIntegrationStatus(id: number, isActive: boolean): Promise<void> {
    return this.integrationOps.updateIntegrationStatus(id, isActive);
  }

  async updateLastTest(id: number, success: boolean, error?: string): Promise<void> {
    return this.integrationOps.updateLastTest(id, success, error);
  }

  async updateLastSync(id: number, success: boolean, error?: string): Promise<void> {
    return this.integrationOps.updateLastSync(id, success, error);
  }

  // Webhook logs management
  async createWebhookLog(log: InsertManychatWebhookLog): Promise<ManychatWebhookLog> {
    return this.webhookLogOps.createWebhookLog(log);
  }

  async getWebhookLogs(integrationId?: number, limit: number = 50): Promise<ManychatWebhookLog[]> {
    return this.webhookLogOps.getWebhookLogs(integrationId, limit);
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string): Promise<void> {
    return this.webhookLogOps.markWebhookProcessed(id, processed, error);
  }

  async getUnprocessedWebhooks(integrationId?: number): Promise<ManychatWebhookLog[]> {
    return this.webhookLogOps.getUnprocessedWebhooks(integrationId);
  }

  /**
   * Log webhook data for debugging and monitoring
   */
  async logWebhook(webhookData: Partial<InsertManychatWebhookLog>): Promise<ManychatWebhookLog> {
    return this.webhookLogOps.logWebhook(webhookData);
  }

  async updateWebhookLogStatus(webhookId: number, processed: boolean): Promise<void> {
    return this.webhookLogOps.updateWebhookLogStatus(webhookId, processed);
  }

  // Helper methods for testing Manychat API
  async testManychatConnection(apiKey: string): Promise<any> {
    return this.apiOps.testManychatConnection(apiKey);
  }

  // Integration with EduChat contact system
  async processManychatLead(webhookData: any, integrationId: number): Promise<{ contactId?: number; conversationId?: number }> {
    return this.leadProcessing.processManychatLead(webhookData, integrationId);
  }

  // Legacy methods for backward compatibility
  async createManychatConfig(config: any) {
    return this.createIntegration(config);
  }

  async getManychatConfig(id: number) {
    return this.getIntegration(id);
  }

  async updateManychatConfig(id: number, config: any) {
    return this.updateIntegration(id, config);
  }

  async deleteManychatConfig(id: number) {
    return this.deleteIntegration(id);
  }

  async getAllManychatConfigs() {
    return this.getIntegrations();
  }
}