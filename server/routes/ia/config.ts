import multer from 'multer';

export const IA_ROUTES = {
  STATS: '/api/ia/stats',
  LOGS: '/api/ia/logs',
  TEST: '/api/ia/test',
  CONTEXTS: '/api/ia/contexts',
  UPLOAD_TRAINING: '/api/ia/upload-training'
} as const;

export const UPLOAD_CONFIG = {
  DEST: 'uploads/ia-training/',
  MAX_SIZE: 10 * 1024 * 1024 // 10MB
} as const;

// Configuração do multer para upload de arquivos
export const upload = multer({ 
  dest: UPLOAD_CONFIG.DEST,
  limits: { fileSize: UPLOAD_CONFIG.MAX_SIZE }
}); 