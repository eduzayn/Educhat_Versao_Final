<<<<<<< HEAD
=======
import { BaseStorage } from '../base/BaseStorage';
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
import { DealBasicOperations } from './dealBasicOperations';
import { DealPaginationOperations } from './dealPaginationOperations';
import { DealAutomaticOperations } from './dealAutomaticOperations';
import { DealMaintenanceOperations } from './dealMaintenanceOperations';
import { DealAuxiliaryOperations } from './dealAuxiliaryOperations';

<<<<<<< HEAD
export class DealStorage {
=======
export class DealStorage extends BaseStorage {
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  private basicOps: DealBasicOperations;
  private paginationOps: DealPaginationOperations;
  private automaticOps: DealAutomaticOperations;
  private maintenanceOps: DealMaintenanceOperations;
  private auxiliaryOps: DealAuxiliaryOperations;

  constructor() {
<<<<<<< HEAD
=======
    super();
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
    this.basicOps = new DealBasicOperations();
    this.paginationOps = new DealPaginationOperations();
    this.automaticOps = new DealAutomaticOperations();
    this.maintenanceOps = new DealMaintenanceOperations();
    this.auxiliaryOps = new DealAuxiliaryOperations();
  }

<<<<<<< HEAD
  // Basic Operations
=======
  // Basic operations
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  async createDeal(dealData: any) {
    return this.basicOps.createDeal(dealData);
  }

  async getDeal(id: number) {
    return this.basicOps.getDeal(id);
  }

<<<<<<< HEAD
  async getDeals() {
    return this.basicOps.getDeals();
  }

=======
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  async updateDeal(id: number, dealData: any) {
    return this.basicOps.updateDeal(id, dealData);
  }

  async deleteDeal(id: number) {
    return this.basicOps.deleteDeal(id);
  }

<<<<<<< HEAD
  async getDealsByStage(stage: string) {
    return this.basicOps.getDealsByStage(stage);
  }

  // Pagination Operations
=======
  async getDeals() {
    return this.basicOps.getDeals();
  }

  // Pagination operations
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  async getDealsWithPagination(params: any) {
    return this.paginationOps.getDealsWithPagination(params);
  }

<<<<<<< HEAD
  // Automatic Operations
=======
  // Automatic operations
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  async createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string) {
    return this.automaticOps.createAutomaticDeal(contactId, canalOrigem, team);
  }

  async getDealsByContact(contactId: number) {
<<<<<<< HEAD
    return this.basicOps.getDeals().then(deals => deals.filter((d: any) => d.contactId === contactId));
  }

  // Maintenance Operations
=======
    return this.basicOps.getDealsByContact(contactId);
  }

  // Maintenance operations
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
  async cleanupDuplicateDeals() {
    return this.maintenanceOps.cleanupDuplicateDeals();
  }

<<<<<<< HEAD
  // Auxiliary Operations
  async getDealStatistics() {
    return this.auxiliaryOps.getDealStatistics();
  }
}
=======
  // Auxiliary operations
  async getDealsByStage(stage: string) {
    return this.basicOps.getDealsByStage(stage);
  }

  async getDealStatistics() {
    return this.auxiliaryOps.getDealStatistics();
  }
} 
>>>>>>> 88bb2ff6 (refactor: dividir messageStorage em módulos menores, atualizar imports e orquestrador)
