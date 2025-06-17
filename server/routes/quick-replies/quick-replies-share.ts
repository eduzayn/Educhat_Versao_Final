import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerQuickRepliesShareRoutes(app: Express) {
  // Share quick reply with team - REST: POST /api/quick-replies/:id/share/team
  app.post('/api/quick-replies/:id/share/team', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const quickReplyId = parseInt(req.params.id);
      const { teamId } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ message: 'Team ID is required' });
      }

      await storage.createQuickReplyTeamShare({
        quickReplyId,
        teamId: parseInt(teamId),
        sharedBy: req.user.id,
      });

      res.status(201).json({ message: 'Quick reply shared with team successfully' });
    } catch (error) {
      console.error('Error sharing quick reply with team:', error);
      res.status(500).json({ message: 'Failed to share quick reply with team' });
    }
  });

  // Share quick reply with user - REST: POST /api/quick-replies/:id/share/user
  app.post('/api/quick-replies/:id/share/user', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const quickReplyId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      await storage.createQuickReplyUserShare({
        quickReplyId,
        userId: parseInt(userId),
        sharedBy: req.user.id,
      });

      res.status(201).json({ message: 'Quick reply shared with user successfully' });
    } catch (error) {
      console.error('Error sharing quick reply with user:', error);
      res.status(500).json({ message: 'Failed to share quick reply with user' });
    }
  });
} 