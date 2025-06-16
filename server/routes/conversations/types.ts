import type { Request } from 'express';
import type { User } from '../../../server/types/user';

// Interface para requisições autenticadas
export interface AuthenticatedRequest extends Request {
  user?: User;
} 