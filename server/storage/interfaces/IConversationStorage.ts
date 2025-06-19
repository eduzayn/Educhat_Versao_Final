import { Conversation, InsertConversation, ConversationWithContact } from '@shared/schema';

export interface IConversationStorage {
  getConversations(limit?: number, offset?: number, filters?: ConversationFilters): Promise<ConversationWithContact[]>;
  searchConversations(searchTerm: string, limit?: number, filters?: ConversationFilters): Promise<ConversationWithContact[]>;
  getConversation(id: number): Promise<ConversationWithContact | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined>;
  assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]>;
  getConversationsByUser(userId: number): Promise<ConversationWithContact[]>;
  getTotalUnreadCount(): Promise<number>;
}

export interface ConversationFilters {
  period?: string;
  team?: number;
  status?: string;
  agent?: number;
} 