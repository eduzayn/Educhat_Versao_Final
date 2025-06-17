import { BaseStorage } from '../base/BaseStorage';
import { DealBasicOperations } from './dealBasicOperations';
import { DealPaginationOperations } from './dealPaginationOperations';
import { DealAutomaticOperations } from './dealAutomaticOperations';
import { DealMaintenanceOperations } from './dealMaintenanceOperations';
import { DealAuxiliaryOperations } from './dealAuxiliaryOperations';

export class DealStorage extends BaseStorage {
  private basicOps: DealBasicOperations;
  private paginationOps: DealPaginationOperations;
  private automaticOps: DealAutomaticOperations;
  private maintenanceOps: DealMaintenanceOperations;
  private auxiliaryOps: DealAuxiliaryOperations;

  constructor() {
    super();
    this.basicOps = new DealBasicOperations();
    this.paginationOps = new DealPaginationOperations();
    this.automaticOps = new DealAutomaticOperations();
    this.maintenanceOps = new DealMaintenanceOperations();
    this.auxiliaryOps = new DealAuxiliaryOperations();
  }

  // Basic operations
  async createDeal(dealData: any) {
    return this.basicOps.createDeal(dealData);
  }

  async getDeal(id: number) {
    return this.basicOps.getDeal(id);
  }

  async updateDeal(id: number, dealData: any) {
    return this.basicOps.updateDeal(id, dealData);
  }

  async deleteDeal(id: number) {
    return this.basicOps.deleteDeal(id);
  }

  async getDeals() {
    return this.basicOps.getDeals();
  }

  // Pagination operations
  async getDealsWithPagination(params: any) {
    return this.paginationOps.getDealsWithPagination(params);
  }

  // Automatic operations
  async createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string) {
    return this.automaticOps.createAutomaticDeal(contactId, canalOrigem, team);
  }

  async getDealsByContact(contactId: number) {
    return this.basicOps.getDealsByContact(contactId);
  }

  // Maintenance operations
  async cleanupDuplicateDeals() {
    return this.maintenanceOps.cleanupDuplicateDeals();
  }

  // Auxiliary operations
  async getDealsByStage(stage: string) {
    return this.basicOps.getDealsByStage(stage);
  }

  async getDealStatistics() {
    return this.auxiliaryOps.getDealStatistics();
  }

  async getContactDeals(contactId: number) {
    return this.basicOps.getDealsByContact(contactId);
  }

  async addDealNote(dealId: number, noteData: any) {
    return this.auxiliaryOps.addDealNote(dealId, noteData);
  }

  async getDealNotes(dealId: number) {
    return this.auxiliaryOps.getDealNotes(dealId);
  }
}
