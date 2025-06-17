import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerQuickRepliesDeleteRoutes(app: Express) {
  // Delete quick reply - REST: DELETE /api/quick-replies/:id
  app.delete('/api/quick-replies/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = parseInt(req.params.id);
      
      // Check if user can delete this quick reply
      const canDelete = await storage.canUserDeleteQuickReply(req.user.id, id);
      if (!canDelete) {
        return res.status(403).json({ 
          message: 'Você não tem permissão para excluir esta resposta rápida. Apenas o criador, administradores e gerentes podem excluí-la.' 
        });
      }
      
      await storage.deleteQuickReply(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      res.status(500).json({ message: 'Failed to delete quick reply' });
    }
  });
} 