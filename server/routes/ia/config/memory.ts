export const MEMORY_ROUTES = {
  BASE: '/api/ia/memory',
  SEARCH: '/api/ia/memory/search',
  STATS: '/api/ia/memory/stats',
  CONVERSATION: '/api/ia/memory/conversation/:conversationId'
} as const;

export const MEMORY_DEFAULTS = {
  PAGE_SIZE: 50,
  SEARCH_LIMIT: 20,
  DEFAULT_CONFIDENCE: 0.8,
  DEFAULT_SOURCE: 'manual'
} as const; 