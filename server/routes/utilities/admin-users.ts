
import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../admin/permissions';
import { storage } from '../../core/storage';

export function setupAdminUsersRoutes(app: Express) {
  // Listar todos os usuários administradores
  app.get('/api/admin-users', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getSystemUsers();
      
      // Filtrar apenas usuários com roles de administrador
      const adminUsers = users.filter(user => {
        const role = user.role?.toLowerCase();
        return role === 'admin' || 
               role === 'administrador' || 
               role === 'superadmin' || 
               role === 'manager' ||
               user.email?.includes('admin@') ||
               user.username?.toLowerCase().includes('admin');
      });

      // Retornar apenas informações essenciais
      const adminList = adminUsers.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }));

      res.json({
        success: true,
        total: adminList.length,
        admins: adminList
      });
    } catch (error) {
      console.error('Erro ao buscar usuários administradores:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar usuários administradores' 
      });
    }
  });
}
