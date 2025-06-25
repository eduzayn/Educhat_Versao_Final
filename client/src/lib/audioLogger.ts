/**
 * Sistema de logging controlado para funcionalidades de áudio
 * Logs técnicos são mostrados apenas em desenvolvimento ou com flag específica
 * Logs essenciais (erros críticos) sempre são exibidos
 */

const isProduction = import.meta.env.MODE === 'production';
const enableDebugLogs = import.meta.env.VITE_ENABLE_AUDIO_DEBUG === 'true';

// Logs técnicos/debug - apenas em dev ou com flag
export const debugLog = (message: string, data?: any) => {
  if (!isProduction || enableDebugLogs) {
    console.log(`🎧 [Audio Debug] ${message}`, data || '');
  }
};

// Logs de informação importantes - sempre em dev, opcionais em produção
export const infoLog = (message: string, data?: any) => {
  if (!isProduction || enableDebugLogs) {
    console.log(`🎵 [Audio] ${message}`, data || '');
  }
};

// Logs de erro críticos - sempre exibidos
export const errorLog = (message: string, error?: any) => {
  console.error(`❌ [Audio Error] ${message}`, error || '');
};

// Logs de sucesso importantes - sempre exibidos
export const successLog = (message: string, data?: any) => {
  console.log(`✅ [Audio] ${message}`, data || '');
};

// Logs de aviso importantes - sempre exibidos
export const warnLog = (message: string, data?: any) => {
  console.warn(`⚠️ [Audio] ${message}`, data || '');
};

/**
 * Tratamento de erros específicos do AudioRecorder com mensagens amigáveis
 */
export const handleAudioError = (error: any): string => {
  if (error.name === 'NotSupportedError') {
    errorLog('Formato de áudio não suportado pelo navegador', error);
    return 'Seu navegador não é compatível com o formato de gravação atual.';
  }
  
  if (error.name === 'NotAllowedError') {
    errorLog('Permissão de microfone negada pelo usuário', error);
    return 'Permissão de microfone necessária para gravação de áudio.';
  }
  
  if (error.name === 'NotFoundError') {
    errorLog('Microfone não encontrado no dispositivo', error);
    return 'Nenhum microfone encontrado. Verifique se há um microfone conectado.';
  }
  
  if (error.name === 'OverconstrainedError') {
    errorLog('Configurações de áudio não compatíveis', error);
    return 'Configurações de áudio incompatíveis com seu dispositivo.';
  }
  
  // Erro genérico
  errorLog('Erro desconhecido na gravação de áudio', error);
  return 'Erro ao acessar o microfone. Tente novamente.';
};