import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function registerQuickRepliesPostRoutes(app: Express) {
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
} 