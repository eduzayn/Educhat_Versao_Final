import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerProfileRoutes(app: Express) {
  // Profile API endpoints - REST: User profile management
  app.patch('/api/profile', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { displayName, email, phone, location, bio } = req.body;
      const updateData: any = {};
      
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;
      if (bio !== undefined) updateData.bio = bio;

      const updatedUser = await storage.userManagement.updateSystemUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ 
        message: 'Perfil atualizado com sucesso',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Change password - REST: POST /api/profile/change-password
  app.post('/api/profile/change-password', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      const user = await storage.userManagement.getSystemUser(req.user.id);
      
      if (!user || !user.password) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      // Atualizar com nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await storage.userManagement.updateSystemUser(req.user.id, { 
        password: hashedNewPassword 
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 