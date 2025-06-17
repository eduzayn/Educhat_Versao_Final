import { BaseStorage } from "../base/BaseStorage";

export class DealAuxiliaryOperations extends BaseStorage {
  async addDealNote(dealId: number, noteData: { content: string; authorId: number }): Promise<any> {
    // Implementar quando necessário - por enquanto retorna sucesso
    return { id: Date.now(), dealId, ...noteData, createdAt: new Date() };
  }

  async getDealNotes(dealId: number): Promise<any[]> {
    // Implementar quando necessário - por enquanto retorna array vazio
    return [];
  }

  async getDealStatistics(filters?: any): Promise<any> {
    // Implementar quando necessário - por enquanto retorna estatísticas básicas
    return {
      totalDeals: 0,
      activeDeals: 0,
      closedDeals: 0,
      totalValue: 0,
      averageValue: 0
    };
  }
} 