import { QuickReply, InsertQuickReply, QuickReplyTeamShare, InsertQuickReplyTeamShare, QuickReplyShare, InsertQuickReplyShare } from '../../../shared/schema';

export interface IQuickReplyStorage {
  getQuickReplies(): Promise<QuickReply[]>;
  getQuickReply(id: number): Promise<QuickReply | undefined>;
  createQuickReply(quickReply: InsertQuickReply): Promise<QuickReply>;
  updateQuickReply(id: number, quickReply: Partial<InsertQuickReply>): Promise<QuickReply>;
  deleteQuickReply(id: number): Promise<void>;
  incrementQuickReplyUsage(id: number): Promise<void>;
  getQuickRepliesByCategory(category: string): Promise<QuickReply[]>;
  searchQuickReplies(query: string): Promise<QuickReply[]>;
  getMostUsedQuickReplies(limit?: number): Promise<QuickReply[]>;
  getUserQuickReplies(userId: number): Promise<QuickReply[]>;
  getQuickReplyCategories(): Promise<string[]>;
  getQuickReplyStatistics(): Promise<any>;
  createQuickReplyTeamShare(share: InsertQuickReplyTeamShare): Promise<QuickReplyTeamShare>;
  createQuickReplyUserShare(share: InsertQuickReplyShare): Promise<QuickReplyShare>;
  deleteQuickReplyTeamShares(quickReplyId: number): Promise<void>;
  deleteQuickReplyUserShares(quickReplyId: number): Promise<void>;
} 