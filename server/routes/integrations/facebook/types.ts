import { z } from 'zod';
import { insertFacebookIntegrationSchema } from '../../../../shared/schema';

export const facebookIntegrationSchema = insertFacebookIntegrationSchema.extend({
  webhookVerifyToken: z.string().min(10, 'Token de verificação deve ter pelo menos 10 caracteres')
});

export const testConnectionSchema = z.object({
  accessToken: z.string().min(1, 'Access Token é obrigatório')
});

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'ID do destinatário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  platform: z.enum(['facebook', 'instagram']).default('facebook')
});

export const replyCommentSchema = z.object({
  commentId: z.string().min(1, 'ID do comentário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória')
}); 