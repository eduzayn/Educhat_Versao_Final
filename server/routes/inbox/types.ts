import { z } from 'zod';

export const CONVERSATION_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  NEW: 'new',
  IN_PROGRESS: 'in_progress'
} as const;

export type ConversationStatus = typeof CONVERSATION_STATUS[keyof typeof CONVERSATION_STATUS];

export const conversationStatusSchema = z.enum([
  CONVERSATION_STATUS.OPEN,
  CONVERSATION_STATUS.PENDING,
  CONVERSATION_STATUS.RESOLVED,
  CONVERSATION_STATUS.CLOSED,
  CONVERSATION_STATUS.NEW,
  CONVERSATION_STATUS.IN_PROGRESS
]); 