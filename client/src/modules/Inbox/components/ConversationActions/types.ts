import { LucideIcon } from 'lucide-react';

export interface ConversationAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  payload?: (conversationId: number, contactId: number) => Record<string, any>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  tooltip?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  disabled?: (conversationId: number, contactId: number, currentStatus?: string) => boolean;
  visible?: (conversationId: number, contactId: number, currentStatus?: string) => boolean;
  group?: 'status' | 'actions' | 'advanced' | 'danger';
}

export interface ConversationActionsConfig {
  conversationId: number;
  contactId: number;
  currentStatus?: string | null;
  onActionComplete?: (actionId: string, result: any) => void;
}