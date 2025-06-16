import { Express, Response } from 'express';
import { db } from '../../core/db';
import { systemUsers, roles } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

export function registerPublicRoutes(app: Express) {
  // Obter informações do usuário atual
  app.get('/api/admin/me', 
    updateLastActivity(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Não autenticado' });
        }

        const [user] = await db
          .select({
            id: systemUsers.id,
            username: systemUsers.username,
            displayName: systemUsers.displayName,
            email: systemUsers.email,
            role: systemUsers.role,
            roleId: systemUsers.roleId,
            teamId: systemUsers.teamId,
            team: systemUsers.team,
            dataKey: systemUsers.dataKey,
            channels: systemUsers.channels,
            teamTypes: systemUsers.teamTypes,
            isActive: systemUsers.isActive,
            status: systemUsers.status,
            isOnline: systemUsers.isOnline,
            lastLoginAt: systemUsers.lastLoginAt,
            lastActivityAt: systemUsers.lastActivityAt,
            createdAt: systemUsers.createdAt,
            roleName: roles.name,
            roleDescription: roles.displayName
          })
          .from(systemUsers)
          .leftJoin(roles, eq(systemUsers.roleId, roles.id))
          .where(eq(systemUsers.id, req.user.id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json(user);
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Atualizar informações do usuário atual
  app.put('/api/admin/me', 
    updateLastActivity(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Não autenticado' });
        }

        const { displayName, email, password } = req.body;

        const updateData: any = {};
        
        if (displayName !== undefined) updateData.displayName = displayName;
        if (email !== undefined) updateData.email = email;

        // Atualizar senha se fornecida
        if (password && password.trim() !== '') {
          const bcrypt = await import('bcryptjs');
          updateData.password = await bcrypt.default.hash(password, 10);
        }

        updateData.updatedAt = new Date();

        const [updatedUser] = await db
          .update(systemUsers)
          .set(updateData)
          .where(eq(systemUsers.id, req.user.id))
          .returning();

        // Não retornar o hash da senha na resposta
        const { password: _, ...userResponse } = updatedUser;

        res.json(userResponse);
      } catch (error) {
        console.error('Erro ao atualizar informações do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Verificar status do sistema
  app.get('/api/admin/health', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verificar conexão com o banco de dados
      await db.execute(sql`SELECT 1`);

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    } catch (error) {
      console.error('Erro ao verificar saúde do sistema:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 