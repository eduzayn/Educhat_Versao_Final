/**
 * Core Storage - Versão simplificada sem re-exports redundantes
 * Substitui o storage/index.ts complexo por uma estrutura direta
 */

import { UserManagementStorage } from './modules/userManagementStorage';
import { ContactStorage } from './modules/contactStorage';
import { ConversationStorage } from './modules/conversationStorage';
import { ChannelStorage } from './modules/channelStorage';
import { DealStorage } from './modules/dealStorage';
import { NotesStorage } from './modules/notesStorage';
import { QuickReplyStorage } from './modules/quickReplyStorage';
import { TeamStorage } from './modules/teamStorage';
import { MessageStorage } from './modules/messageStorage';
import { ManychatStorage } from './modules/manychatStorage';
import { FacebookStorage } from './modules/facebookStorage';

/**
 * Storage simplificado - acesso direto aos módulos sem camadas desnecessárias
 */
class CoreStorage {
  public readonly users = new UserManagementStorage();
  public readonly contacts = new ContactStorage();
  public readonly conversations = new ConversationStorage();
  public readonly channels = new ChannelStorage();
  public readonly deals = new DealStorage();
  public readonly notes = new NotesStorage();
  public readonly quickReplies = new QuickReplyStorage();
  public readonly teams = new TeamStorage();
  public readonly messages = new MessageStorage();
  public readonly manychat = new ManychatStorage();
  public readonly facebook = new FacebookStorage();

  // Métodos de conveniência mais comuns (sem duplicar tudo)
  async getUser(id: number) {
    return this.users.getUser(id);
  }

  async createUser(userData: any) {
    return this.users.createUser(userData);
  }

  async getContact(id: number) {
    return this.contacts.getContact(id);
  }

  async createContact(contactData: any) {
    return this.contacts.createContact(contactData);
  }

  async getConversation(id: number) {
    return this.conversations.getConversation(id);
  }

  async createConversation(conversationData: any) {
    return this.conversations.createConversation(conversationData);
  }

  async getTeam(id: number) {
    return this.teams.getTeam(id);
  }

  async getTeams() {
    return this.teams.getTeams();
  }

  async createDeal(dealData: any) {
    return this.deals.createDeal(dealData);
  }

  async createAutomaticDeal(contactId: number, canalOrigem: string, teamType: string, initialStage: string) {
    return this.deals.createAutomaticDeal(contactId, canalOrigem, teamType, initialStage);
  }

  async getDealsByContact(contactId: number) {
    return this.deals.getDealsByContact(contactId);
  }

  async testTeamDetection(messageContent: string) {
    return this.teams.testTeamDetection(messageContent);
  }
}

// Instância singleton
export const coreStorage = new CoreStorage();

// Compatibilidade com código existente
export const storage = coreStorage;