export const DOCUMENT_ROUTES = {
  UPLOAD: '/upload',
  SEARCH: '/search',
  PROCESSED: '/processed',
  STATS: '/stats',
  RECENT: '/recent'
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['.pdf', '.docx', '.doc'],
  UPLOAD_DIR: './uploads'
} as const; 