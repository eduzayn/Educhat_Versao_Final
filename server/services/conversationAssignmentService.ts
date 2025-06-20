import { storage } from '../storage/index';
import { AssignmentOptions } from './assignmentTypes';

export class ConversationAssignmentService {
  async assignConversationToTeam(
    conversationId: number, 
    teamId: number, 
    options: AssignmentOptions = {}
  ): Promise<{ success: boolean; teamId: number; userId?: number }> {
    try {
      await storage.conversation.assignConversationToTeam(conversationId, teamId);
      
      // Usar round-robin equitativo para seleção de usuário
      const { equitableRoundRobinService } = await import('./equitableRoundRobinService');
      const roundRobinResult = await equitableRoundRobinService.assignUserToConversation(conversationId, teamId);
      
      const availableUser = roundRobinResult.success ? 
        { id: roundRobinResult.userId } : 
        await storage.team.getAvailableUserFromTeam(teamId);
      
      if (availableUser && !roundRobinResult.success && availableUser.id) {
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
}

export const conversationAssignmentService = new ConversationAssignmentService(); 