import { z } from 'zod';

export const HANDOFF_ROUTES = {
  BASE: '/',
  STATS: '/stats',
  CONVERSATION: '/conversation/:conversationId',
  PENDING_USER: '/pending/user/:userId',
  PENDING_TEAM: '/pending/team/:teamId',
  ACCEPT: '/:id/accept',
  REJECT: '/:id/reject',
  EVALUATE: '/evaluate',
  AUTO_CREATE: '/auto-create',
  INTELLIGENT: {
    ANALYZE: '/intelligent/analyze',
    EXECUTE: '/intelligent/execute',
    TEAM_CAPACITY: '/intelligent/team-capacity',
    STATS: '/intelligent/stats'
  }
} as const;

export const createHandoffSchema = z.object({
  conversationId: z.number(),
  fromUserId: z.number().optional(),
  toUserId: z.number().optional(),
  fromTeamId: z.number().optional(),
  toTeamId: z.number().optional(),
  type: z.enum(['manual', 'automatic', 'escalation']),
  reason: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  aiClassification: z.object({
    confidence: z.number(),
    suggestedTeam: z.string().optional(),
    urgency: z.string(),
    frustrationLevel: z.number(),
    intent: z.string()
  }).optional(),
  metadata: z.record(z.any()).optional()
}); 