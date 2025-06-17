<<<<<<< HEAD
import { BaseStorage } from "../base/BaseStorage";

/**
 * Facebook storage module - manages Facebook integration data
 */
export class FacebookStorage extends BaseStorage {
  async createFacebookConfig(config: any) {
    // Implementation for Facebook configuration
    return config;
  }

  async getFacebookConfig(id: number) {
    // Implementation to get Facebook configuration
    return null;
  }

  async updateFacebookConfig(id: number, config: any) {
    // Implementation to update Facebook configuration
    return config;
  }

  async deleteFacebookConfig(id: number) {
    // Implementation to delete Facebook configuration
    return true;
  }

  async getAllFacebookConfigs() {
    // Implementation to get all Facebook configurations
    return [];
  }
}
=======
import { BaseStorage } from '../base/BaseStorage';
import { FacebookIntegrationOperations } from './facebookIntegrationOperations';
import { FacebookWebhookLogOperations } from './facebookWebhookLogOperations';
import { FacebookApiOperations } from './facebookApiOperations';
import { FacebookMessageProcessing } from './facebookMessageProcessing';

export class FacebookStorage extends BaseStorage {
  private integrationOps: FacebookIntegrationOperations;
  private webhookLogOps: FacebookWebhookLogOperations;
  private apiOps: FacebookApiOperations;
  private messageProcessing: FacebookMessageProcessing;

  constructor() {
    super();
    this.integrationOps = new FacebookIntegrationOperations();
    this.webhookLogOps = new FacebookWebhookLogOperations();
    this.apiOps = new FacebookApiOperations();
    this.messageProcessing = new FacebookMessageProcessing();
  }

  // Integration operations
  async getIntegrations() {
    return this.integrationOps.getIntegrations();
  }

  async getIntegration(id: number) {
    return this.integrationOps.getIntegration(id);
  }

  async getActiveIntegration() {
    return this.integrationOps.getActiveIntegration();
  }

  async createIntegration(integration: any) {
    return this.integrationOps.createIntegration(integration);
  }

  async updateIntegration(id: number, updates: any) {
    return this.integrationOps.updateIntegration(id, updates);
  }

  async deleteIntegration(id: number) {
    return this.integrationOps.deleteIntegration(id);
  }

  async updateIntegrationStatus(id: number, isActive: boolean) {
    return this.integrationOps.updateIntegrationStatus(id, isActive);
  }

  // Webhook log operations
  async createWebhookLog(log: any) {
    return this.webhookLogOps.createWebhookLog(log);
  }

  async getWebhookLogs(integrationId?: number, limit?: number) {
    return this.webhookLogOps.getWebhookLogs(integrationId, limit);
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string) {
    return this.webhookLogOps.markWebhookProcessed(id, processed, error);
  }

  async getUnprocessedWebhooks(integrationId?: number) {
    return this.webhookLogOps.getUnprocessedWebhooks(integrationId);
  }

  // API operations
  async testFacebookConnection(accessToken: string) {
    return this.apiOps.testFacebookConnection(accessToken);
  }

  async sendMessage(pageAccessToken: string, recipientId: string, message: string, platform?: 'facebook' | 'instagram') {
    return this.apiOps.sendMessage(pageAccessToken, recipientId, message, platform);
  }

  async replyToComment(pageAccessToken: string, commentId: string, message: string) {
    return this.apiOps.replyToComment(pageAccessToken, commentId, message);
  }

  // Message processing
  async processFacebookMessage(webhookData: any, integrationId: number) {
    return this.messageProcessing.processFacebookMessage(webhookData, integrationId);
  }
} 
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
