// Configurações padronizadas de cache para todo o sistema - OTIMIZADAS PARA PERFORMANCE
export const CACHE_TIMES = {
  CONVERSATIONS: 45000,    // 45 segundos - lista de conversas (reduzido para atualizações mais frequentes)
  MESSAGES: 180000,        // 3 minutos - mensagens da conversa (aumentado para reduzir requisições)
  UNREAD_COUNT: 20000,     // 20 segundos - contador não lidas (mais responsivo)
  CONTACT_DATA: 300000,    // 5 minutos - dados do contato
  CHANNELS: 600000,        // 10 minutos - canais disponíveis (raramente mudam)
  TEAMS: 600000,           // 10 minutos - equipes e usuários (raramente mudam)
  QUICK_REPLIES: 300000,   // 5 minutos - respostas rápidas
  SYSTEM_DATA: 900000      // 15 minutos - dados do sistema (muito estáticos)
} as const;

// GC Time padrão para limpeza de cache
export const GC_TIME = 300000; // 5 minutos

// Configurações para diferentes tipos de dados
export const CACHE_CONFIG = {
  // Dados que mudam frequentemente
  REALTIME: {
    staleTime: CACHE_TIMES.UNREAD_COUNT,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: false
  },
  
  // Dados de conversas
  CONVERSATIONS: {
    staleTime: CACHE_TIMES.CONVERSATIONS,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: false
  },
  
  // Mensagens
  MESSAGES: {
    staleTime: CACHE_TIMES.MESSAGES,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: false
  },
  
  // Dados estáticos/semi-estáticos
  STATIC: {
    staleTime: CACHE_TIMES.SYSTEM_DATA,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: false
  }
} as const;