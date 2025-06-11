/**
 * Storage Central Simplificado
 * Substitui o complexo storage/index.ts (1223 linhas) por acesso direto aos módulos
 */

import { UserManagementStorage } from '../storage/modules/userManagementStorage';
import { ContactStorage } from '../storage/modules/contactStorage';
import { ConversationStorage } from '../storage/modules/conversationStorage';
import { ChannelStorage } from '../storage/modules/channelStorage';
import { DealStorage } from '../storage/modules/dealStorage';
import { TeamStorage } from '../storage/modules/teamStorage';
import { MessageStorage } from '../storage/modules/messageStorage';
import { QuickReplyStorage } from '../storage/modules/quickReplyStorage';

class CentralStorage {
  public readonly users = new UserManagementStorage();
  public readonly contacts = new ContactStorage();
  public readonly conversations = new ConversationStorage();
  public readonly channels = new ChannelStorage();
  public readonly deals = new DealStorage();
  public readonly teams = new TeamStorage();
  public readonly messages = new MessageStorage();
  public readonly quickReplies = new QuickReplyStorage();

  // Métodos de conveniência diretos - sem proxies desnecessários
  getUser = (id: number) => this.users.getUser(id);
  createUser = (userData: any) => this.users.createUser(userData);
  getContact = (id: number) => this.contacts.getContact(id);
  createContact = (contactData: any) => this.contacts.createContact(contactData);
  getConversation = (id: number) => this.conversations.getConversation(id);
  createConversation = (conversationData: any) => this.conversations.createConversation(conversationData);
  getTeam = (id: number) => this.teams.getTeam(id);
  getTeams = () => this.teams.getTeams();
  createDeal = (dealData: any) => this.deals.createDeal(dealData);
  getDealsByContact = (contactId: number) => this.deals.getDealsByContact(contactId);
  createAutomaticDeal = (contactId: number, canalOrigem: string, teamType: string, initialStage: string) => 
    this.deals.createAutomaticDeal(contactId, canalOrigem, teamType, initialStage);
}

export const storage = new CentralStorage();