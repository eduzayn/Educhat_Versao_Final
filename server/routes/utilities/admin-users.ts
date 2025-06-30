
import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../admin/permissions';
import { storage } from '../../core/storage';

export function setupAdminUsersRoutes(app: Express) {
  // Endpoint temporário para consulta detalhada de admins
  app.get('/api/admin-users/detailed', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getSystemUsers();
      
      // Filtrar usuários administrativos
      const adminUsers = users.filter(user => {
        const role = user.role?.toLowerCase();
        return role === 'admin' || 
               role === 'administrador' || 
               role === 'superadmin' || 
               role === 'manager' ||
               role === 'gerente' ||
               user.email?.includes('admin@') ||
               user.username?.toLowerCase().includes('admin');
      });

      // Log detalhado no console do servidor
      console.log('\n=== LISTA DE USUÁRIOS ADMINISTRATIVOS ===');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName || user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   Último login: ${user.lastLoginAt || 'Nunca'}`);
        console.log('   ---');
      });
      console.log(`=== TOTAL: ${adminUsers.length} usuários administrativos ===\n`);

      res.json({
        success: true,
        total: adminUsers.length,
        admins: adminUsers.map(user => ({
          nome: user.displayName || user.username,
          email: user.email,
          username: user.username,
          role: user.role,
          ativo: user.isActive,
          ultimoLogin: user.lastLoginAt
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar usuários administrativos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar usuários administrativos' 
      });
    }
  });

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
