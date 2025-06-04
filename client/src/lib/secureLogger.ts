// Sistema de logging seguro que não expõe dados sensíveis
export const secureLog = {
  // Log para processamento de áudio sem expor dados base64
  audio: (action: string, messageId?: string | number, duration?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎧 Áudio: ${action}${messageId ? ` - ID: ${messageId}` : ''}${duration ? ` - Duração: ${duration}s` : ''}`);
    }
  },

  // Log para processamento de imagem sem expor dados base64
  image: (action: string, messageId?: string | number, size?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🖼️ Imagem: ${action}${messageId ? ` - ID: ${messageId}` : ''}${size ? ` - Tamanho: ${Math.round(size/1024)}KB` : ''}`);
    }
  },

  // Log para URLs (seguro de expor)
  url: (action: string, url: string) => {
    if (process.env.NODE_ENV === 'development') {
      // Apenas mostrar domínio e path, sem query parameters sensíveis
      const urlObj = new URL(url);
      const safeUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      console.log(`🔗 URL: ${action} - ${safeUrl}`);
    }
  },

  // Log geral para debug
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      if (data && typeof data === 'object') {
        // Remover campos sensíveis antes de logar
        const safeData = { ...data };
        delete safeData.content;
        delete safeData.audioUrl;
        delete safeData.imageUrl;
        console.log(`🔍 ${message}`, safeData);
      } else {
        console.log(`🔍 ${message}`, data);
      }
    }
  },

  // Log de erros (sempre ativo)
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
  }
};