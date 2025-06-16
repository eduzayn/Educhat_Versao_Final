import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage";

export function registerQuickRepliesPatchRoutes(app: Express) {
  // Increment usage count - REST: PATCH /api/quick-replies/:id/usage
  app.patch('/api/quick-replies/:id/usage', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementQuickReplyUsage(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error incrementing quick reply usage:', error);
      res.status(500).json({ message: 'Failed to increment usage count' });
    }
  });
} 