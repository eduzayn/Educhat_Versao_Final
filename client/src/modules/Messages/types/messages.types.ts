export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface TypingIndicator {
  conversationId: number;
  isTyping: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'new_message' | 'typing' | 'join_conversation' | 'send_message' | 'online_status';
  conversationId?: number;
  message?: any;
  isTyping?: boolean;
  contactId?: number;
  isOnline?: boolean;
}