import { BaseStorage } from "../base/BaseStorage";
import { deals } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DealMaintenanceOperations extends BaseStorage {
  async cleanupDuplicateDeals(): Promise<{ removed: number; details: any[] }> {
    console.log('🧹 Iniciando limpeza de deals duplicados...');
    
    // Buscar todos os deals ativos
    const allDeals = await this.db.select().from(deals).orderBy(deals.contactId, deals.createdAt);
    
    // Agrupar deals por contato e teamType
    const dealGroups = new Map();
    
    for (const deal of allDeals) {
      const key = `${deal.contactId}-${deal.teamType}-${deal.canalOrigem}`;
      if (!dealGroups.has(key)) {
        dealGroups.set(key, []);
      }
      dealGroups.get(key).push(deal);
    }
    
    // Identificar e remover duplicatas
    const toRemove = [];
    const details = [];
    
    for (const [key, deals] of Array.from(dealGroups.entries())) {
      if (deals.length > 1) {
        // Manter apenas o deal mais recente
        const sortedDeals = deals.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const keepDeal = sortedDeals[0];
        const duplicates = sortedDeals.slice(1);
        
        for (const duplicate of duplicates) {
          toRemove.push(duplicate.id);
          details.push({
            removed: duplicate,
            kept: keepDeal,
            reason: 'Duplicate deal for same contact/teamType/channel'
          });
        }
      }
    }
    
    // Executar remoção
    for (const dealId of toRemove) {
      await this.db.delete(deals).where(eq(deals.id, dealId));
    }
    
    console.log(`🧹 Limpeza concluída: ${toRemove.length} deals duplicados removidos`);
    
    return {
      removed: toRemove.length,
      details
    };
  }
} 