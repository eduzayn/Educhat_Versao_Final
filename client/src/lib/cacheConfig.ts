// Configurações padronizadas de cache para todo o sistema
export const CACHE_TIMES = {
  CONVERSATIONS: 60000,    // 1 minuto - lista de conversas
  MESSAGES: 120000,        // 2 minutos - mensagens da conversa
  UNREAD_COUNT: 30000,     // 30 segundos - contador não lidas
  CONTACT_DATA: 300000,    // 5 minutos - dados do contato
  CHANNELS: 300000,        // 5 minutos - canais disponíveis
  TEAMS: 300000,           // 5 minutos - equipes e usuários
  QUICK_REPLIES: 300000,   // 5 minutos - respostas rápidas
  SYSTEM_DATA: 600000      // 10 minutos - dados do sistema (roles, etc)
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