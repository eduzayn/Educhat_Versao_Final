export interface IPermissionStorage {
  canUserRespondToOthersConversations(userId: number): Promise<boolean>;
  canUserRespondToOwnConversations(userId: number): Promise<boolean>;
  canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean>;
} 