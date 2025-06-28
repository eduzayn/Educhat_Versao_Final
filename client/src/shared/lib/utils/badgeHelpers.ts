/**
 * Utilitários para badges reutilizáveis
 */

export interface BadgeConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  text: string;
  color?: string;
  bgColor?: string;
  iconClass?: string;
}

// Helper para badges de status genéricos
export const getStatusBadge = (isActive: boolean): BadgeConfig => ({
  variant: isActive ? 'default' : 'secondary',
  text: isActive ? 'Ativo' : 'Inativo',
  color: isActive ? 'text-green-700' : 'text-gray-700'
});

// Helper para badges de conexão
export const getConnectionBadge = (isConnected: boolean): BadgeConfig => ({
  variant: isConnected ? 'default' : 'destructive',
  text: isConnected ? 'Conectado' : 'Desconectado',
  color: isConnected ? 'text-green-700' : 'text-red-700'
});

// Helper para badges de status online
export const getOnlineBadge = (isOnline: boolean): BadgeConfig => ({
  variant: isOnline ? 'default' : 'secondary',
  text: isOnline ? 'Online' : 'Offline',
  color: isOnline ? 'text-green-700' : 'text-gray-700'
});

// Helper para badges de progresso (vendas, metas, etc.)
export const getProgressBadge = (current: number, target: number): BadgeConfig => {
  const percentage = (current / target) * 100;
  
  if (percentage >= 100) {
    return {
      variant: 'default',
      text: 'Atingida',
      bgColor: 'bg-green-100',
      color: 'text-green-800'
    };
  } else if (percentage >= 80) {
    return {
      variant: 'default',
      text: 'Próximo',
      bgColor: 'bg-yellow-100',
      color: 'text-yellow-800'
    };
  } else if (percentage >= 50) {
    return {
      variant: 'secondary',
      text: 'Em progresso',
      bgColor: 'bg-blue-100',
      color: 'text-blue-800'
    };
  } else {
    return {
      variant: 'outline',
      text: 'Iniciando',
      bgColor: 'bg-gray-100',
      color: 'text-gray-800'
    };
  }
};

// Helper para badges de prioridade
export const getPriorityBadge = (priority: 'low' | 'medium' | 'high' | 'urgent'): BadgeConfig => {
  const configs = {
    low: { variant: 'secondary' as const, text: 'Baixa', color: 'text-gray-600' },
    medium: { variant: 'default' as const, text: 'Média', color: 'text-blue-600' },
    high: { variant: 'default' as const, text: 'Alta', color: 'text-orange-600' },
    urgent: { variant: 'destructive' as const, text: 'Urgente', color: 'text-red-600' }
  };
  
  return configs[priority];
};

// Helper para badges de tipo de mensagem
export const getMessageTypeBadge = (type: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    text: { variant: 'outline', text: 'Texto', color: 'text-gray-600' },
    image: { variant: 'default', text: 'Imagem', color: 'text-blue-600' },
    audio: { variant: 'default', text: 'Áudio', color: 'text-green-600' },
    video: { variant: 'default', text: 'Vídeo', color: 'text-purple-600' },
    document: { variant: 'outline', text: 'Documento', color: 'text-orange-600' },
    sticker: { variant: 'secondary', text: 'Sticker', color: 'text-pink-600' }
  };
  
  return configs[type] || { variant: 'outline', text: type, color: 'text-gray-600' };
};

// Helper para badges de canal
export const getChannelBadge = (channelType: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    whatsapp: { variant: 'default', text: 'WhatsApp', color: 'text-green-600' },
    instagram: { variant: 'default', text: 'Instagram', color: 'text-pink-600' },
    facebook: { variant: 'default', text: 'Facebook', color: 'text-blue-600' },
    email: { variant: 'outline', text: 'Email', color: 'text-gray-600' },
    website: { variant: 'secondary', text: 'Website', color: 'text-purple-600' }
  };
  
  return configs[channelType] || { variant: 'outline', text: channelType, color: 'text-gray-600' };
};

// Helper para badges de status de coaching
export const getCoachingStatusBadge = (status: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    pending: { variant: 'outline', text: 'Pendente', color: 'text-yellow-600 border-yellow-600' },
    in_progress: { variant: 'outline', text: 'Em Andamento', color: 'text-blue-600 border-blue-600' },
    completed: { variant: 'outline', text: 'Concluído', color: 'text-green-600 border-green-600' }
  };
  
  return configs[status] || { variant: 'outline', text: 'Desconhecido', color: 'text-gray-600' };
};

// Helper para badges de status de comissões
export const getCommissionStatusBadge = (status: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    pending: { variant: 'outline', text: 'Pendente', color: 'text-yellow-600' },
    approved: { variant: 'default', text: 'Aprovado', color: 'text-green-600' },
    paid: { variant: 'default', text: 'Pago', color: 'text-blue-600' },
    rejected: { variant: 'destructive', text: 'Rejeitado', color: 'text-red-600' }
  };
  
  return configs[status] || { variant: 'outline', text: 'Desconhecido', color: 'text-gray-600' };
};

// Helper para badges de status de conversa
export const getConversationStatusBadge = (status: string): BadgeConfig => {
  const configs: Record<string, BadgeConfig> = {
    open: { variant: 'default', text: 'Aberta', color: 'text-green-600' },
    closed: { variant: 'secondary', text: 'Fechada', color: 'text-gray-600' },
    pending: { variant: 'outline', text: 'Pendente', color: 'text-yellow-600' },
    archived: { variant: 'outline', text: 'Arquivada', color: 'text-gray-500' }
  };
  
  return configs[status] || { variant: 'outline', text: status, color: 'text-gray-600' };
};

// Helper para badges de status de canal
export const getChannelStatusBadge = (isActive: boolean, isConnected?: boolean): BadgeConfig => {
  if (typeof isConnected === 'boolean') {
    if (!isActive) return { variant: 'secondary', text: 'Inativo', color: 'text-gray-600' };
    return isConnected 
      ? { variant: 'default', text: 'Conectado', color: 'text-green-600' }
      : { variant: 'destructive', text: 'Desconectado', color: 'text-red-600' };
  }
  
  return isActive 
    ? { variant: 'default', text: 'Ativo', color: 'text-green-600' }
    : { variant: 'secondary', text: 'Inativo', color: 'text-gray-600' };
};

// Helper para badges de status de integração Facebook
export const getFacebookIntegrationStatusBadge = (status: string, isActive: boolean): BadgeConfig => {
  if (!isActive) return { variant: 'secondary', text: 'Inativo', color: 'text-gray-600' };
  
  const configs: Record<string, BadgeConfig> = {
    connected: { variant: 'default', text: 'Conectado', color: 'text-green-600' },
    disconnected: { variant: 'destructive', text: 'Desconectado', color: 'text-red-600' },
    error: { variant: 'destructive', text: 'Erro', color: 'text-red-600' },
    pending: { variant: 'outline', text: 'Pendente', color: 'text-yellow-600' }
  };
  
  return configs[status] || { variant: 'outline', text: status, color: 'text-gray-600' };
};

// Helper para renderizar múltiplos badges com limite
export const renderLimitedBadges = (items: string[], maxVisible = 3) => {
  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;
  
  return {
    visibleItems,
    remainingCount: remainingCount > 0 ? remainingCount : 0,
    hasMore: remainingCount > 0,
    moreText: `+${remainingCount} mais`
  };
};