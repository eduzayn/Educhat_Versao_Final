import type { Express, Response, Request } from "express";
import { db } from '../../core/db';
import { systemUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function registerUserRoutes(app: Express) {
  // Rota pública para informações básicas do usuário (apenas para UI)
  // Completamente isolada do sistema de permissões para evitar conflitos produção vs desenvolvimento
  app.get('/api/users/:id/basic', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'ID do usuário inválido' });
      }

      // Buscar apenas informações básicas necessárias para exibição
      const [user] = await db
        .select({
          id: systemUsers.id,
          username: systemUsers.username,
          displayName: systemUsers.displayName,
          isActive: systemUsers.isActive,
        })
        .from(systemUsers)
        .where(eq(systemUsers.id, userId))
        .limit(1);

      if (!user || !user.isActive) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar informações básicas do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Redirect legacy user routes to admin endpoints for backward compatibility
  app.get('/api/users', (req, res) => {
    res.redirect(301, '/api/admin/users');
  });
  
  app.get('/api/users/:id', (req, res) => {
    res.redirect(301, `/api/admin/users/${req.params.id}`);
  });
  
  app.post('/api/users', (req, res) => {
    res.redirect(307, '/api/admin/users');
  });
  
  app.put('/api/users/:id', (req, res) => {
    res.redirect(307, `/api/admin/users/${req.params.id}`);
  });
  
  app.delete('/api/users/:id', (req, res) => {
    res.redirect(307, `/api/admin/users/${req.params.id}`);
  });
}