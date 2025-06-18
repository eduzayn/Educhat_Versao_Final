/*
 * ⚠️  UTILITÁRIO PROTEGIDO - SISTEMA DE CARREGAMENTO DE MÍDIAS SOB DEMANDA ⚠️
 * 
 * Este utilitário é CRÍTICO para o funcionamento do carregamento sob demanda.
 * O sistema está ESTÁVEL e NÃO deve ser modificado sem autorização explícita.
 * 
 * Data de Proteção: 18/06/2025
 * Status: SISTEMA ESTÁVEL - NÃO MODIFICAR
 */

export const messageOptimizations = {
  mediaCache: new Map<number, string>(),
  
  loadingStates: new Set<number>(),
  
  getCachedMedia(messageId: number): string | null {
    return this.mediaCache.get(messageId) || null;
  },
  
  setCachedMedia(messageId: number, content: string): void {
    this.mediaCache.set(messageId, content);
    if (this.mediaCache.size > 50) {
      const firstKey = this.mediaCache.keys().next().value;
      this.mediaCache.delete(firstKey);
    }
  },
  
  isLoading(messageId: number): boolean {
    return this.loadingStates.has(messageId);
  },
  
  setLoading(messageId: number, loading: boolean): void {
    if (loading) {
      this.loadingStates.add(messageId);
    } else {
      this.loadingStates.delete(messageId);
    }
  },
  
  clearCache(): void {
    this.mediaCache.clear();
    this.loadingStates.clear();
  },
  
  preloadMedia(messageIds: number[]): void {
    messageIds.forEach(id => {
      if (!this.mediaCache.has(id) && !this.isLoading(id)) {
        console.log(`📋 Mídia ${id} marcada para pré-carregamento`);
      }
    });
  }
};
