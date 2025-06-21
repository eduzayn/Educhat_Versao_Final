import { storage } from '../storage/index';
import { AssignmentOptions } from './assignmentTypes';
import { assignmentIsolation } from '../utils/assignment-isolation';

export class ConversationAssignmentService {
  async assignConversationToTeam(
    conversationId: number, 
    teamId: number, 
    options: AssignmentOptions = {}
  ): Promise<{ success: boolean; teamId: number; userId?: number }> {
    try {
      // MELHORIA 3: Isolamento para evitar replicação indevida
      const shouldBlock = assignmentIsolation.shouldBlockAssignment({
        conversationId,
        teamId,
        timestamp: Date.now(),
        source: 'team_assignment'
      });
      
      if (shouldBlock) {
        console.log(`🛡️ [PROD-AUDIT] ASSIGNMENT: Bloqueada duplicação para conversa ${conversationId} → equipe ${teamId}`);
        return { success: false, teamId };
      }
      
      console.log(`👥 [PROD-AUDIT] ASSIGNMENT: Conversa ${conversationId} → Equipe ${teamId}`);
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
      // MELHORIA 3: Isolamento para evitar replicação indevida
      const shouldBlock = assignmentIsolation.shouldBlockAssignment({
        conversationId,
        userId,
        timestamp: Date.now(),
        source: 'user_assignment'
      });
      
      if (shouldBlock) {
        console.log(`🛡️ [PROD-AUDIT] ASSIGNMENT: Bloqueada duplicação para conversa ${conversationId} → usuário ${userId}`);
        return { success: false, userId };
      }
      
      console.log(`👤 [PROD-AUDIT] ASSIGNMENT: Conversa ${conversationId} → Usuário ${userId}`);
      await storage.conversation.assignConversationToUser(conversationId, userId);
      return { success: true, userId };
    } catch (error) {
      console.error('Error assigning conversation to user:', error);
      throw error;
    }
  }
}

export const conversationAssignmentService = new ConversationAssignmentService(); 