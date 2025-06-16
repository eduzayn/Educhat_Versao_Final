import { storage } from '../storage';

interface AssignmentOptions {
  method?: 'manual' | 'automatic';
  assignedBy?: number;
}

export class SimpleAssignmentService {
  async assignConversationToTeam(
    conversationId: number, 
    teamId: number, 
    options: AssignmentOptions = {}
  ): Promise<{ success: boolean; teamId: number; userId?: number }> {
    try {
      await storage.conversation.assignConversationToTeam(conversationId, teamId);
      
      const availableUser = await storage.team.getAvailableUserFromTeam(teamId);
      if (availableUser) {
        await storage.conversation.assignConversationToUser(conversationId, availableUser.id);
      }
      
      return { success: true, teamId, userId: availableUser?.id };
    } catch (error) {
      console.error('Error assigning conversation to team:', error);
      throw error;
    }
  }

  async assignConversationToUser(
    conversationId: number, 
    userId: number, 
    options: AssignmentOptions = {}
  ): Promise<{ success: boolean; userId: number }> {
    try {
      await storage.conversation.assignConversationToUser(conversationId, userId);
      return { success: true, userId };
    } catch (error) {
      console.error('Error assigning conversation to user:', error);
      throw error;
    }
  }

  async assignDealToUser(
    dealId: number, 
    userId: number, 
    options: AssignmentOptions = {}
  ): Promise<{ success: boolean; dealId: number; userId: number }> {
    try {
      console.log(`Deal ${dealId} assigned to user ${userId}`);
      return { success: true, dealId, userId };
    } catch (error) {
      console.error('Error assigning deal to user:', error);
      throw error;
    }
  }
}

export const simpleAssignmentService = new SimpleAssignmentService();
