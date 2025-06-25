// Barrel exports para todos os módulos de storage
export type { IStorage } from './interfaces/IStorage';
export { BaseStorage } from './base/BaseStorage';

// Módulos de storage
export { AuthStorage } from './modules/authStorage';
export { ContactStorage } from './modules/contactStorage';
export { ConversationStorage } from './modules/conversationStorage';
export { ChannelStorage } from './modules/channelStorage';
export { DealStorage } from './modules/dealStorage';
export { NotesStorage } from './modules/notesStorage';
export { QuickReplyStorage } from './modules/quickReplyStorage';
export { TeamStorage } from './modules/teamStorage';
export { MessageStorage } from './modules/messageStorage';
export { ManychatStorage } from './modules/manychatStorage';
export { FacebookStorage } from './modules/facebookStorage';

export { KeywordRoutingStorage } from './modules/keywordRoutingStorage';

// Utilitários


/**
 * Classe principal do Storage que implementa a interface IStorage
 * Agrega todos os módulos especializados de storage
 */
import { IStorage } from './interfaces/IStorage';
import { AuthStorage } from './modules/authStorage';
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

import { KeywordRoutingStorage } from './modules/keywordRoutingStorage';
import { SystemStorage } from './modules/systemStorage';

export class DatabaseStorage implements IStorage {
  private auth: AuthStorage;
  private contact: ContactStorage;
  private conversation: ConversationStorage;
  private channel: ChannelStorage;
  private deal: DealStorage;
  private notes: NotesStorage;
  private quickReply: QuickReplyStorage;
  private team: TeamStorage;
  private message: MessageStorage;
  private keywordRouting: KeywordRoutingStorage;
  private system: SystemStorage;
  public manychat: ManychatStorage;
  public facebook: FacebookStorage;
  public macrosetor: MacrosetorStorage;

  constructor() {
    this.auth = new AuthStorage();
    this.contact = new ContactStorage();
    this.conversation = new ConversationStorage();
    this.channel = new ChannelStorage();
    this.deal = new DealStorage();
    this.notes = new NotesStorage();
    this.quickReply = new QuickReplyStorage();
    this.team = new TeamStorage();
    this.message = new MessageStorage();
    this.keywordRouting = new KeywordRoutingStorage();
    this.system = new SystemStorage();
    this.manychat = new ManychatStorage();
    this.facebook = new FacebookStorage();

  }

  // ==================== AUTH OPERATIONS ====================
  async getUser(id: string) {
    return this.auth.getUser(id);
  }

  async getUserByEmail(email: string) {
    return this.auth.getUserByEmail(email);
  }

  async createUser(user: any) {
    return this.auth.createUser(user);
  }

  async upsertUser(user: any) {
    return this.auth.upsertUser(user);
  }

  async getSystemUsers() {
    return this.auth.getSystemUsers();
  }

  async getSystemUser(id: number) {
    return this.auth.getSystemUser(id);
  }

  async createSystemUser(user: any) {
    return this.auth.createSystemUser(user);
  }

  async updateSystemUser(id: number, user: any) {
    return this.auth.updateSystemUser(id, user);
  }

  async deleteSystemUser(id: number) {
    return this.auth.deleteSystemUser(id);
  }

  // ==================== CONTACT OPERATIONS ====================
  async getContact(id: number) {
    return this.contact.getContact(id);
  }

  async getContactWithTags(id: number) {
    return this.contact.getContactWithTags(id);
  }

  async createContact(contact: any) {
    return this.contact.createContact(contact);
  }

  async updateContact(id: number, contact: any) {
    return this.contact.updateContact(id, contact);
  }

  async searchContacts(query: string) {
    return this.contact.searchContacts(query);
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean) {
    return this.contact.updateContactOnlineStatus(id, isOnline);
  }

  async findOrCreateContact(userIdentity: string, contactData: any) {
    return this.contact.findOrCreateContact(userIdentity, contactData);
  }

  async getContactInterests(contactId: number) {
    return this.contact.getContactInterests(contactId);
  }

  async getContactTags(contactId: number) {
    return this.contact.getContactTags(contactId);
  }

  async addContactTag(tag: any) {
    return this.contact.addContactTag(tag);
  }

  async removeContactTag(contactId: number, tag: string) {
    return this.contact.removeContactTag(contactId, tag);
  }

  // ==================== CONVERSATION OPERATIONS ====================
  async getConversations(limit?: number, offset?: number) {
    return this.conversation.getConversations(limit, offset);
  }

  async getConversation(id: number) {
    return this.conversation.getConversation(id);
  }

  async createConversation(conversation: any) {
    return this.conversation.createConversation(conversation);
  }

  async updateConversation(id: number, conversation: any) {
    return this.conversation.updateConversation(id, conversation);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string) {
    return this.conversation.getConversationByContactAndChannel(contactId, channel);
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual') {
    return this.conversation.assignConversationToTeam(conversationId, teamId, method);
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual') {
    return this.conversation.assignConversationToUser(conversationId, userId, method);
  }

  async getConversationsByTeam(teamId: number) {
    return this.conversation.getConversationsByTeam(teamId);
  }

  async getConversationsByUser(userId: number) {
    return this.conversation.getConversationsByUser(userId);
  }

  async getTotalUnreadCount() {
    return this.conversation.getTotalUnreadCount();
  }

  async markConversationAsRead(conversationId: number) {
    return this.conversation.markConversationAsRead(conversationId);
  }

  // ==================== CHANNEL OPERATIONS ====================
  async getChannels() {
    return this.channel.getChannels();
  }

  async getChannel(id: number) {
    return this.channel.getChannel(id);
  }

  async getChannelById(id: number) {
    return this.channel.getChannel(id);
  }

  async getAllChannels() {
    return this.channel.getChannels();
  }

  async getChannelsByType(type: string) {
    return this.channel.getChannelsByType(type);
  }

  async createChannel(channel: any) {
    return this.channel.createChannel(channel);
  }

  async updateChannel(id: number, channel: any) {
    return this.channel.updateChannel(id, channel);
  }

  async deleteChannel(id: number) {
    return this.channel.deleteChannel(id);
  }

  async updateChannelConnectionStatus(id: number, connectionStatus: string, isConnected: boolean) {
    return this.channel.updateChannelConnectionStatus(id, connectionStatus, isConnected);
  }

  // ==================== MESSAGE OPERATIONS ====================
  async getMessages(conversationId: number, limit?: number, offset?: number) {
    return this.message.getMessages(conversationId, limit, offset);
  }

  async getMessagesBefore(conversationId: number, beforeId: number, limit?: number) {
    return this.message.getMessagesBefore(conversationId, beforeId, limit);
  }

  async getMessage(id: number) {
    return this.message.getMessage(id);
  }

  async getMessageMedia(messageId: number) {
    return this.message.getMessageMedia(messageId);
  }

  async createMessage(message: any) {
    return this.message.createMessage(message);
  }

  async markMessageAsRead(id: number) {
    return this.message.markMessageAsRead(id);
  }

  async markMessageAsUnread(id: number) {
    return this.message.markMessageAsUnread(id);
  }

  async markMessageAsDelivered(id: number) {
    return this.message.markMessageAsDelivered(id);
  }

  async markMessageAsDeleted(id: number) {
    return this.message.markMessageAsDeleted(id);
  }

  async getMessageByZApiId(zapiMessageId: string) {
    return this.message.getMessageByZApiId(zapiMessageId);
  }

  async getMessagesByMetadata(key: string, value: string) {
    return this.message.getMessagesByMetadata(key, value);
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string) {
    return this.message.updateMessageZApiStatus(whatsappMessageId, status);
  }

  // ==================== DEAL OPERATIONS ====================
  async getDeals() {
    return this.deal.getDeals();
  }

  async getDealsWithPagination(params: { page: number; limit: number; macrosetor?: string; stage?: string; search?: string; }) {
    return this.deal.getDealsWithPagination(params);
  }

  async getDeal(id: number) {
    return this.deal.getDeal(id);
  }

  async getDealsByContact(contactId: number) {
    return this.deal.getDealsByContact(contactId);
  }

  async getDealsByStage(stage: string) {
    return this.deal.getDealsByStage(stage);
  }

  async createDeal(deal: any) {
    return this.deal.createDeal(deal);
  }

  async updateDeal(id: number, deal: any) {
    return this.deal.updateDeal(id, deal);
  }

  async deleteDeal(id: number) {
    return this.deal.deleteDeal(id);
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string) {
    return this.deal.createAutomaticDeal(contactId, canalOrigem, macrosetor);
  }

  async cleanupDuplicateDeals() {
    return this.deal.cleanupDuplicateDeals();
  }

  // ==================== NOTES OPERATIONS ====================
  async getContactNotes(contactId: number) {
    return this.notes.getContactNotes(contactId);
  }

  async createContactNote(note: any) {
    return this.notes.createContactNote(note);
  }

  async updateContactNote(id: number, note: any) {
    return this.notes.updateContactNote(id, note);
  }

  async deleteContactNote(id: number) {
    return this.notes.deleteContactNote(id);
  }

  // ==================== QUICK REPLY OPERATIONS ====================
  async getQuickReplies() {
    return this.quickReply.getQuickReplies();
  }

  async getQuickReply(id: number) {
    return this.quickReply.getQuickReply(id);
  }

  async createQuickReply(quickReply: any) {
    return this.quickReply.createQuickReply(quickReply);
  }

  async updateQuickReply(id: number, quickReply: any) {
    return this.quickReply.updateQuickReply(id, quickReply);
  }

  async deleteQuickReply(id: number) {
    return this.quickReply.deleteQuickReply(id);
  }

  async incrementQuickReplyUsage(id: number) {
    return this.quickReply.incrementQuickReplyUsage(id);
  }

  async createQuickReplyTeamShare(share: any) {
    return this.quickReply.createQuickReplyTeamShare(share);
  }

  async createQuickReplyUserShare(share: any) {
    return this.quickReply.createQuickReplyUserShare(share);
  }

  async deleteQuickReplyTeamShares(quickReplyId: number) {
    return this.quickReply.deleteQuickReplyTeamShares(quickReplyId);
  }

  async deleteQuickReplyUserShares(quickReplyId: number) {
    return this.quickReply.deleteQuickReplyUserShares(quickReplyId);
  }

  // ==================== TEAM OPERATIONS ====================
  async getTeams() {
    return this.team.getTeams();
  }

  async getTeam(id: number) {
    return this.team.getTeam(id);
  }

  async createTeam(team: any) {
    return this.team.createTeam(team);
  }

  async updateTeam(id: number, team: any) {
    return this.team.updateTeam(id, team);
  }

  async deleteTeam(id: number) {
    return this.team.deleteTeam(id);
  }

  async getTeamByMacrosetor(macrosetor: string) {
    return this.team.getTeamByMacrosetor(macrosetor);
  }

  async getAvailableUserFromTeam(teamId: number) {
    return this.team.getAvailableUserFromTeam(teamId);
  }

  async getUserTeams(userId: number) {
    return this.team.getUserTeams(userId);
  }

  async addUserToTeam(userTeam: { teamId: number; userId: number; isActive?: boolean | null; role?: string | null; }) {
    return this.team.addUserToTeam(userTeam);
  }

  async removeUserFromTeam(userId: number, teamId: number) {
    return this.team.removeUserFromTeam(userId, teamId);
  }

  async updateTeamMemberRole(userId: number, teamId: number, role: string) {
    return this.team.updateTeamMemberRole(userId, teamId, role);
  }

  async getTeamMembers(teamId: number) {
    return this.team.getTeamMembers(teamId);
  }

  async getTeamStatistics(teamId: number) {
    return this.team.getTeamStatistics(teamId);
  }

  async transferConversationBetweenTeams(
    conversationId: number, 
    fromTeamId: number | null, 
    toTeamId: number, 
    reason?: string,
    transferredBy?: string
  ) {
    return this.team.transferConversationBetweenTeams(conversationId, fromTeamId, toTeamId, reason, transferredBy);
  }

  async getTransferHistory(limit?: number) {
    return this.team.getTransferHistory(limit);
  }

  // ==================== KEYWORD ROUTING OPERATIONS ====================
  async getKeywordRoutings() {
    return this.keywordRouting.getKeywordRoutings();
  }

  async getKeywordRouting(id: number) {
    return this.keywordRouting.getKeywordRouting(id);
  }

  async createKeywordRouting(data: any) {
    return this.keywordRouting.createKeywordRouting(data);
  }

  async updateKeywordRouting(id: number, data: any) {
    return this.keywordRouting.updateKeywordRouting(id, data);
  }

  async deleteKeywordRouting(id: number) {
    return this.keywordRouting.deleteKeywordRouting(id);
  }

  async findTeamByMessage(message: string) {
    return this.keywordRouting.findTeamByMessage(message);
  }

  async keywordExists(keyword: string, excludeId?: number) {
    return this.keywordRouting.keywordExists(keyword, excludeId);
  }

  async toggleKeywordRoutingStatus(id: number) {
    return this.keywordRouting.toggleKeywordRoutingStatus(id);
  }

  async getKeywordRouting(id: number) {
    return this.keywordRouting.getKeywordRouting(id);
  }

  async createKeywordRouting(data: any) {
    return this.keywordRouting.createKeywordRouting(data);
  }

  async updateKeywordRouting(id: number, data: any) {
    return this.keywordRouting.updateKeywordRouting(id, data);
  }

  async deleteKeywordRouting(id: number) {
    return this.keywordRouting.deleteKeywordRouting(id);
  }

  async findTeamByMessage(message: string) {
    return this.keywordRouting.findTeamByMessage(message);
  }

  async getKeywordRoutingsByTeam(teamId: number) {
    return this.keywordRouting.getKeywordRoutingsByTeam(teamId);
  }

  async keywordExists(keyword: string, excludeId?: number) {
    return this.keywordRouting.keywordExists(keyword, excludeId);
  }

  async toggleKeywordRoutingStatus(id: number) {
    return this.keywordRouting.toggleKeywordRoutingStatus(id);
  }

  // ==================== PERMISSIONS (padrão TRUE, customizar depois) ==========
  async canUserRespondToOthersConversations() {
    return true;
  }

  async canUserRespondToOwnConversations() {
    return true;
  }

  async canUserRespondToConversation() {
    return true;
  }

  // ==================== PLACEHOLDER METHODS ====================
  async getAllMessages(): Promise<any[]> {
    throw new Error("Método getAllMessages não implementado");
  }

  async getRoles(): Promise<any[]> {
    return this.system.getRoles();
  }

  async getRole(id: number): Promise<any> {
    return this.system.getRole(id);
  }

  async createRole(role: any): Promise<any> {
    return this.system.createRole(role);
  }

  async updateRole(id: number, roleData: any): Promise<any> {
    return this.system.updateRole(id, roleData);
  }

  async deleteRole(id: number): Promise<any> {
    return this.system.deleteRole(id);
  }

  // Placeholder methods for missing interface requirements
  async getQuickRepliesByCategory(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async searchQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getMostUsedQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getUserQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getSharedQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getQuickRepliesByUser(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getQuickRepliesByTeam(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  // ==================== TEAM-MACROSETOR UNIFICATION ====================
  
  // Get team by macrosetor (treating them as identical)
  async getTeamByMacrosetor(macrosetor: string): Promise<any> {
    if (!macrosetor) return null;
    
    try {
      const result = await this.team.getTeamByMacrosetor(macrosetor);
      return result;
    } catch (error) {
      console.error('Erro ao buscar equipe por macrosetor:', error);
      return null;
    }
  }

  // Get or create team for macrosetor
  async getOrCreateTeamForMacrosetor(macrosetor: string): Promise<any> {
    let team = await this.getTeamByMacrosetor(macrosetor);
    
    if (!team) {
      // Team configuration mapping
      const teamConfigs = {
        comercial: { name: 'Equipe Comercial', description: 'Vendas e matrículas', color: 'green', priority: 1, maxCapacity: 50 },
        suporte: { name: 'Equipe Suporte', description: 'Problemas técnicos', color: 'blue', priority: 2, maxCapacity: 30 },
        cobranca: { name: 'Equipe Cobrança', description: 'Questões financeiras', color: 'orange', priority: 1, maxCapacity: 25 },
        tutoria: { name: 'Equipe Tutoria', description: 'Dúvidas acadêmicas', color: 'purple', priority: 2, maxCapacity: 40 },
        secretaria: { name: 'Equipe Secretaria', description: 'Documentos e certificados', color: 'indigo', priority: 2, maxCapacity: 20 },
        geral: { name: 'Equipe Geral', description: 'Atendimento geral', color: 'gray', priority: 3, maxCapacity: 100 }
      };
      
      const config = teamConfigs[macrosetor as keyof typeof teamConfigs] || teamConfigs.geral;
      
      try {
        team = await this.team.createTeam({
          name: config.name,
          description: config.description,
          color: config.color,
          isActive: true,
          maxCapacity: config.maxCapacity,
          priority: config.priority,
          autoAssignment: true
        });
        
        console.log(`✅ Equipe criada automaticamente: ${config.name} (${macrosetor})`);
      } catch (createError) {
        console.error('Erro ao criar equipe automaticamente:', createError);
      }
    }
    
    return team;
  }

  // Assign conversation to team/macrosetor
  async assignConversationToTeam(conversationId: number, teamId: number, assignmentType: string = 'manual'): Promise<void> {
    try {
      await this.conversation.assignConversationToTeam(conversationId, teamId, assignmentType);
      console.log(`✅ Conversa ${conversationId} atribuída à equipe ${teamId} (${assignmentType})`);
    } catch (error) {
      console.error('Erro ao atribuir conversa à equipe:', error);
    }
  }

  // Get available user from team
  async getAvailableUserFromTeam(teamId: number): Promise<any> {
    try {
      const teamMembers = await this.team.getTeamMembers(teamId);
      if (teamMembers.length === 0) {
        return null;
      }
      // Return first available user for now
      return teamMembers[0];
    } catch (error) {
      console.error('Erro ao buscar usuário disponível da equipe:', error);
      return null;
    }
  }

  // Assign conversation to user
  async assignConversationToUser(conversationId: number, userId: number, assignmentType: string = 'manual'): Promise<void> {
    try {
      await this.conversation.assignConversationToUser(conversationId, userId, assignmentType);
      console.log(`✅ Conversa ${conversationId} atribuída ao usuário ${userId} (${assignmentType})`);
    } catch (error) {
      console.error('Erro ao atribuir conversa ao usuário:', error);
    }
  }

  // ==================== MACROSETOR DETECTION ====================
  detectMacrosetor(content: string, channel?: string): string | null {
    // Implementação direta da detecção de macrosetor
    if (!content || content.trim().length < 3) {
      return 'geral';
    }

    const contentLower = content.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Definir palavras-chave por macrosetor
    const macrosetorKeywords = {
      'comercial': [
        'curso', 'matricula', 'inscrição', 'valor', 'preço', 'pagamento', 'mensalidade',
        'desconto', 'promoção', 'oferta', 'venda', 'comprar', 'adquirir',
        'investimento', 'custo', 'quanto custa', 'informações sobre curso',
        'quero saber mais', 'tenho interesse', 'gostaria de', 'comercial',
        'vendas', 'negócio', 'proposta', 'orçamento'
      ],
      'cobranca': [
        'pagamento', 'boleto', 'fatura', 'cobrança', 'débito', 'vencimento',
        'atraso', 'multa', 'juros', 'parcelamento', 'renegociação', 'acordo',
        'quitação', 'financeiro', 'conta em atraso', 'inadimplência',
        'segunda via', 'extrato', 'comprovante', 'recibo', 'nota fiscal',
        'mensalidades', 'em atraso'
      ],
      'suporte': [
        'problema', 'erro', 'nao funciona', 'bug', 'falha', 'dificuldade',
        'ajuda', 'socorro', 'suporte', 'tecnico', 'nao consigo', 'travou',
        'lento', 'nao carrega', 'senha', 'login', 'acesso', 'recuperar',
        'resetar', 'configurar', 'instalacao', 'tutorial', 'como fazer',
        'falar no suporte', 'gostaria de falar', 'zayn', 'atendimento'
      ],
      'tutoria': [
        'dúvida', 'exercício', 'questão', 'matéria', 'conteúdo', 'disciplina',
        'professor', 'tutor', 'explicação', 'esclarecimento', 'aula',
        'videoaula', 'material', 'apostila', 'livro', 'bibliografia',
        'cronograma', 'horário', 'agenda', 'revisão', 'prova', 'exame'
      ],
      'secretaria': [
        'certificado', 'diploma', 'declaracao', 'historico', 'documento',
        'carteirinha', 'identidade estudantil', 'rematricula', 'transferencia',
        'trancamento', 'cancelamento', 'secretaria', 'academico',
        'coordenacao', 'diretoria', 'protocolo', 'solicitacao', 'requerimento',
        'gostaria de solicitar', 'solicitar certificado', 'segunda graduacao',
        'curso concluido', 'letras ingles', 'formacao', 'graduacao'
      ]
    };

    // Detectar macrosetor com maior número de matches
    let bestMatch = { macrosetor: 'geral', score: 0 };

    for (const [macrosetor, keywords] of Object.entries(macrosetorKeywords)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const keywordNormalized = keyword.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        if (contentLower.includes(keywordNormalized)) {
          score += 1;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { macrosetor, score };
      }
    }

    console.log('🔍 Detecção de macrosetor:', {
      content: content.substring(0, 100) + '...',
      detected: bestMatch.macrosetor,
      score: bestMatch.score
    });

    return bestMatch.score > 0 ? bestMatch.macrosetor : 'geral';
  }
}

// Export storage instance
export const storage = new DatabaseStorage();