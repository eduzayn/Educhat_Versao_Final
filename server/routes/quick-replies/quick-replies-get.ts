import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";

export function registerQuickRepliesGetRoutes(app: Express) {
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