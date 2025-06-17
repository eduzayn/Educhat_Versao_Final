import { storage } from "../storage/index";

/**
 * Verifica se deve criar deal automático
 */
export async function shouldCreateAutomaticDeal(contactId: number, teamType: string): Promise<boolean> {
  try {
    const existingDeals = await storage.getDealsByContact(contactId);
    
    // Verificar se já existe deal ativo no mesmo teamType
    const activeDealInSector = existingDeals.find(deal => {
      const isActive = !['closed', 'lost', 'closed_won', 'closed_lost'].includes(deal.stage);
      return isActive && deal.teamType === teamType;
    });

    return !activeDealInSector;
  } catch (error) {
    console.error('Erro ao verificar necessidade de deal automático:', error);
    return false;
  }
} 