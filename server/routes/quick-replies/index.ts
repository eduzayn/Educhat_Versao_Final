import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function registerQuickRepliesRoutes(app: Express) {
  
  // Get all quick replies - REST: GET /api/quick-replies
  app.get('/api/quick-replies', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quickReplies = await storage.getQuickReplies();
      res.json(quickReplies);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      res.status(500).json({ message: 'Failed to fetch quick replies' });
    }
  });

  // Get quick reply by ID - REST: GET /api/quick-replies/:id
  app.get('/api/quick-replies/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      const quickReply = await storage.getQuickReply(id);
      
      if (!quickReply) {
        return res.status(404).json({ message: 'Quick reply not found' });
      }
      
      res.json(quickReply);
    } catch (error) {
      console.error('Error fetching quick reply:', error);
      res.status(500).json({ message: 'Failed to fetch quick reply' });
    }
  });

  // Create new quick reply - REST: POST /api/quick-replies
  app.post('/api/quick-replies', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { selectedTeams, selectedUsers, shareScope, ...restData } = req.body;
      
      // Basic validation
      if (!restData.title || !restData.content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const validatedData = {
        title: restData.title,
        content: restData.content,
        type: restData.type || 'text',
        category: restData.category || 'general',
        tags: restData.tags || [],
        isActive: restData.isActive !== false,
        shareScope: shareScope || 'private',
        createdBy: req.user?.id,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null
      };
      
      // Handle file upload for media types
      if (req.file && validatedData.type !== 'text') {
        const fileUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
        
        validatedData.fileUrl = fileUrl;
        validatedData.fileName = req.file.originalname;
        validatedData.fileSize = req.file.size;
        validatedData.mimeType = req.file.mimetype;
      }
      
      const quickReply = await storage.createQuickReply(validatedData);
      
      // Create granular sharing records if applicable
      if (shareScope === 'team' && selectedTeams && Array.isArray(selectedTeams)) {
        for (const teamId of selectedTeams) {
          await storage.createQuickReplyTeamShare({
            quickReplyId: quickReply.id,
            teamId: parseInt(teamId),
            sharedBy: req.user?.id,
          });
        }
      }
      
      if (shareScope === 'users' && selectedUsers && Array.isArray(selectedUsers)) {
        for (const userId of selectedUsers) {
          await storage.createQuickReplyUserShare({
            quickReplyId: quickReply.id,
            userId: userId,
            sharedBy: req.user?.id,
          });
        }
      }
      
      res.status(201).json(quickReply);
    } catch (error) {
      console.error('Error creating quick reply:', error);
      res.status(400).json({ message: 'Invalid quick reply data' });
    }
  });

  // Update quick reply - REST: PUT /api/quick-replies/:id
  app.put('/api/quick-replies/:id', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = parseInt(req.params.id);
      
      // Check if user can edit this quick reply
      const canEdit = await storage.canUserEditQuickReply(req.user.id, id);
      if (!canEdit) {
        return res.status(403).json({ 
          message: 'Você não tem permissão para editar esta resposta rápida. Atendentes só podem editar respostas criadas por eles próprios.' 
        });
      }
      
      const validatedData: any = {};
      
      // Only update provided fields
      if (req.body.title) validatedData.title = req.body.title;
      if (req.body.content) validatedData.content = req.body.content;
      if (req.body.type) validatedData.type = req.body.type;
      if (req.body.category) validatedData.category = req.body.category;
      if (req.body.tags) validatedData.tags = req.body.tags;
      if (req.body.isActive !== undefined) validatedData.isActive = req.body.isActive;
      
      // Handle file upload for media types
      if (req.file && validatedData.type !== 'text') {
        const fileUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
        
        validatedData.fileUrl = fileUrl;
        validatedData.fileName = req.file.originalname;
        validatedData.fileSize = req.file.size;
        validatedData.mimeType = req.file.mimetype;
      }
      
      const quickReply = await storage.updateQuickReply(id, validatedData);
      res.json(quickReply);
    } catch (error) {
      console.error('Error updating quick reply:', error);
      res.status(400).json({ message: 'Invalid quick reply data' });
    }
  });

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

  // Get quick replies by category - REST: GET /api/quick-replies/category/:category
  app.get('/api/quick-replies/category/:category', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category } = req.params;
      const quickReplies = await storage.getQuickRepliesByCategory(category);
      res.json(quickReplies);
    } catch (error) {
      console.error('Error fetching quick replies by category:', error);
      res.status(500).json({ message: 'Failed to fetch quick replies by category' });
    }
  });

  // Search quick replies - REST: GET /api/quick-replies/search
  app.get('/api/quick-replies/search', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { q, category, type } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const quickReplies = await storage.searchQuickReplies({
        query: q as string,
        category: category as string,
        type: type as string,
        userId: req.user?.id
      });
      
      res.json(quickReplies);
    } catch (error) {
      console.error('Error searching quick replies:', error);
      res.status(500).json({ message: 'Failed to search quick replies' });
    }
  });

  // Get most used quick replies - REST: GET /api/quick-replies/most-used
  app.get('/api/quick-replies/most-used', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = '10' } = req.query;
      const quickReplies = await storage.getMostUsedQuickReplies(parseInt(limit as string));
      res.json(quickReplies);
    } catch (error) {
      console.error('Error fetching most used quick replies:', error);
      res.status(500).json({ message: 'Failed to fetch most used quick replies' });
    }
  });

  // Get user's quick replies - REST: GET /api/quick-replies/my-replies
  app.get('/api/quick-replies/my-replies', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const quickReplies = await storage.getUserQuickReplies(req.user.id);
      res.json(quickReplies);
    } catch (error) {
      console.error('Error fetching user quick replies:', error);
      res.status(500).json({ message: 'Failed to fetch user quick replies' });
    }
  });

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

  // Get quick reply categories - REST: GET /api/quick-replies/categories
  app.get('/api/quick-replies/categories', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categories = await storage.getQuickReplyCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching quick reply categories:', error);
      res.status(500).json({ message: 'Failed to fetch quick reply categories' });
    }
  });

  // Get quick reply statistics - REST: GET /api/quick-replies/stats
  app.get('/api/quick-replies/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      const stats = await storage.getQuickReplyStatistics(period as string);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching quick reply statistics:', error);
      res.status(500).json({ message: 'Failed to fetch quick reply statistics' });
    }
  });
}