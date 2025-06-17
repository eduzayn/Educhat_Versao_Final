import { db } from '../core/db';
import { eq } from 'drizzle-orm';
import { handoffs } from '../../shared/schema';
import { assignmentCompatibilityService } from './assignmentCompatibilityService';

export class HandoffOperations {
  async createHandoff(handoffData: any) {
    return assignmentCompatibilityService.createHandoff(
      handoffData,
      assignmentCompatibilityService.executeHandoffById
    );
  }

  async executeHandoff(handoffId: number) {
    return assignmentCompatibilityService.executeHandoffById(handoffId);
  }

  async getHandoffStats(days: number = 7) {
    return assignmentCompatibilityService.getHandoffStats(days);
  }
}

export const handoffOperations = new HandoffOperations(); 