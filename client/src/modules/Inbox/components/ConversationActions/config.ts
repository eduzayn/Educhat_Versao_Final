import {
  MailCheck,
  Clock,
  UserCheck,
  Bot,
  Calendar,
  History,
  ArrowRight,
  UserX,
  FileText,
  Search,
  Info,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';

import { ConversationAction } from './types';

export const conversationActions: ConversationAction[] = [
  // Status Actions
  {
    id: 'mark-unread',
    label: 'Marcar como não lida',
    icon: MailCheck,
    color: 'text-blue-600',
    group: 'status',
    endpoint: '/api/conversations/{conversationId}/mark-unread',
    method: 'POST',
    tooltip: 'Retorna esta conversa para o topo da lista',
    loadingMessage: 'Marcando como não lida...',
    successMessage: 'Conversa marcada como não lida',
    errorMessage: 'Erro ao marcar como não lida'
  },
  {
    id: 'status-pending',
    label: 'Marcar como pendente',
    icon: Clock,
    color: 'text-orange-600',
    group: 'status',
    endpoint: '/api/conversations/{conversationId}/status',
    method: 'PATCH',
    payload: () => ({ status: 'pending' }),
    tooltip: 'Define esta conversa como pendente de resolução',
    loadingMessage: 'Atualizando status...',
    successMessage: 'Status atualizado para pendente',
    errorMessage: 'Erro ao atualizar status',
    disabled: (_, __, currentStatus) => currentStatus === 'pending'
  },
  {
    id: 'status-resolved',
    label: 'Marcar como resolvida',
    icon: CheckCircle,
    color: 'text-green-600',
    group: 'status',
    endpoint: '/api/conversations/{conversationId}/status',
    method: 'PATCH',
    payload: () => ({ status: 'resolved' }),
    tooltip: 'Marca esta conversa como resolvida',
    loadingMessage: 'Resolvendo conversa...',
    successMessage: 'Conversa marcada como resolvida',
    errorMessage: 'Erro ao resolver conversa',
    disabled: (_, __, currentStatus) => currentStatus === 'resolved'
  },
  {
    id: 'status-closed',
    label: 'Fechar conversa',
    icon: XCircle,
    color: 'text-red-600',
    group: 'status',
    endpoint: '/api/conversations/{conversationId}/status',
    method: 'PATCH',
    payload: () => ({ status: 'closed' }),
    tooltip: 'Fecha esta conversa definitivamente',
    loadingMessage: 'Fechando conversa...',
    successMessage: 'Conversa fechada',
    errorMessage: 'Erro ao fechar conversa',
    requiresConfirmation: true,
    confirmationMessage: 'Tem certeza que deseja fechar esta conversa?',
    disabled: (_, __, currentStatus) => currentStatus === 'closed'
  },

  // Action Items
  {
    id: 'follow',
    label: 'Seguir conversa',
    icon: UserCheck,
    color: 'text-green-600',
    group: 'actions',
    endpoint: '/api/conversations/{conversationId}/follow',
    method: 'POST',
    tooltip: 'Receba notificações sobre esta conversa',
    loadingMessage: 'Adicionando aos seguidos...',
    successMessage: 'Agora você está seguindo esta conversa',
    errorMessage: 'Erro ao seguir conversa'
  },
  {
    id: 'assign-to-me',
    label: 'Atribuir para mim',
    icon: UserCheck,
    color: 'text-blue-600',
    group: 'actions',
    endpoint: '/api/conversations/{conversationId}/assign',
    method: 'POST',
    payload: () => ({ assignToCurrentUser: true }),
    tooltip: 'Assume a responsabilidade por esta conversa',
    loadingMessage: 'Atribuindo conversa...',
    successMessage: 'Conversa atribuída para você',
    errorMessage: 'Erro ao atribuir conversa'
  },
  {
    id: 'schedule-message',
    label: 'Agendar mensagem',
    icon: Calendar,
    color: 'text-blue-600',
    group: 'actions',
    tooltip: 'Agenda uma mensagem para ser enviada mais tarde',
    loadingMessage: 'Abrindo agendador...',
    successMessage: 'Agendador aberto',
    errorMessage: 'Erro ao abrir agendador'
  },

  // Advanced Actions
  {
    id: 'sync-history',
    label: 'Sincronizar histórico',
    icon: History,
    color: 'text-gray-600',
    group: 'advanced',
    endpoint: '/api/conversations/{conversationId}/sync-history',
    method: 'POST',
    tooltip: 'Sincroniza o histórico completo desta conversa',
    loadingMessage: 'Sincronizando histórico...',
    successMessage: 'Histórico sincronizado',
    errorMessage: 'Erro ao sincronizar histórico'
  },
  {
    id: 'transfer-channel',
    label: 'Transferir para outro canal',
    icon: ArrowRight,
    color: 'text-blue-600',
    group: 'advanced',
    tooltip: 'Move esta conversa para outro canal de comunicação',
    loadingMessage: 'Preparando transferência...',
    successMessage: 'Transferência iniciada',
    errorMessage: 'Erro ao iniciar transferência'
  },
  {
    id: 'export-csv',
    label: 'Exportar para CSV',
    icon: FileText,
    color: 'text-gray-600',
    group: 'advanced',
    endpoint: '/api/conversations/{conversationId}/export',
    method: 'GET',
    tooltip: 'Exporta o histórico desta conversa em formato CSV',
    loadingMessage: 'Gerando arquivo CSV...',
    successMessage: 'Arquivo CSV gerado',
    errorMessage: 'Erro ao gerar CSV'
  },
  {
    id: 'search-messages',
    label: 'Pesquisar mensagens',
    icon: Search,
    color: 'text-gray-600',
    group: 'advanced',
    tooltip: 'Busca por mensagens específicas nesta conversa',
    loadingMessage: 'Abrindo busca...',
    successMessage: 'Busca aberta',
    errorMessage: 'Erro ao abrir busca'
  },
  {
    id: 'view-info',
    label: 'Ver informações detalhadas',
    icon: Info,
    color: 'text-blue-600',
    group: 'advanced',
    endpoint: '/api/conversations/{conversationId}/details',
    method: 'GET',
    tooltip: 'Mostra informações detalhadas sobre esta conversa',
    loadingMessage: 'Carregando informações...',
    successMessage: 'Informações carregadas',
    errorMessage: 'Erro ao carregar informações'
  },

  // Danger Actions
  {
    id: 'block-contact',
    label: 'Bloquear contato',
    icon: UserX,
    color: 'text-red-600',
    group: 'danger',
    endpoint: '/api/contacts/{contactId}/block',
    method: 'POST',
    tooltip: 'Bloqueia este contato permanentemente',
    loadingMessage: 'Bloqueando contato...',
    successMessage: 'Contato bloqueado',
    errorMessage: 'Erro ao bloquear contato',
    requiresConfirmation: true,
    confirmationMessage: 'Tem certeza que deseja bloquear este contato? Esta ação é irreversível.'
  }
];

export const getActionsByGroup = (group: ConversationAction['group']) => {
  return conversationActions.filter(action => action.group === group);
};

export const getVisibleActions = (conversationId: number, contactId: number, currentStatus?: string) => {
  return conversationActions.filter(action => {
    if (action.visible && !action.visible(conversationId, contactId, currentStatus)) {
      return false;
    }
    return true;
  });
};

export const getEnabledActions = (conversationId: number, contactId: number, currentStatus?: string) => {
  return conversationActions.filter(action => {
    if (action.disabled && action.disabled(conversationId, contactId, currentStatus)) {
      return false;
    }
    return true;
  });
};