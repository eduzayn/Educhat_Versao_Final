import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function registerQuickRepliesPutRoutes(app: Express) {
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
} 