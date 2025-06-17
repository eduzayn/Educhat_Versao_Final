import { DealBasicOperations } from './dealBasicOperations';
import { DealPaginationOperations } from './dealPaginationOperations';
import { DealAutomaticOperations } from './dealAutomaticOperations';
import { DealMaintenanceOperations } from './dealMaintenanceOperations';
import { DealAuxiliaryOperations } from './dealAuxiliaryOperations';

export class DealStorage {
  private basicOps: DealBasicOperations;
  private paginationOps: DealPaginationOperations;
  private automaticOps: DealAutomaticOperations;
  private maintenanceOps: DealMaintenanceOperations;
  private auxiliaryOps: DealAuxiliaryOperations;

  constructor() {
    this.basicOps = new DealBasicOperations();
    this.paginationOps = new DealPaginationOperations();
    this.automaticOps = new DealAutomaticOperations();
    this.maintenanceOps = new DealMaintenanceOperations();
    this.auxiliaryOps = new DealAuxiliaryOperations();
  }

  // Basic Operations
  async createDeal(dealData: any) {
    return this.basicOps.createDeal(dealData);
  }

  async getDeal(id: number) {
    return this.basicOps.getDeal(id);
  }

  async getDeals() {
    return this.basicOps.getDeals();
  }

  async updateDeal(id: number, dealData: any) {
    return this.basicOps.updateDeal(id, dealData);
  }

  async deleteDeal(id: number) {
    return this.basicOps.deleteDeal(id);
  }

  async getDealsByStage(stage: string) {
    return this.basicOps.getDealsByStage(stage);
  }

  // Pagination Operations
  async getDealsWithPagination(params: any) {
    return this.paginationOps.getDealsWithPagination(params);
  }

  // Automatic Operations
  async createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string) {
    return this.automaticOps.createAutomaticDeal(contactId, canalOrigem, team);
  }

  async getDealsByContact(contactId: number) {
    return this.automaticOps.getDealsByContact(contactId);
  }

  // Maintenance Operations
  async cleanupDuplicateDeals() {
    return this.maintenanceOps.cleanupDuplicateDeals();
  }

  // Auxiliary Operations
  async getDealStatistics() {
    return this.auxiliaryOps.getDealStatistics();
  }
}