// Exportações principais do módulo ConversationActions
export { ConversationActionsDropdown } from './index';
export { ConversationActionItem } from './ConversationActionItem';
export { useConversationActions } from './useConversationActions';
export { conversationActions, getActionsByGroup, getVisibleActions, getEnabledActions } from './config';
export type { ConversationAction, ConversationActionsConfig } from './types';

// Exportação padrão para compatibilidade
export { ConversationActionsDropdown as default } from './index';