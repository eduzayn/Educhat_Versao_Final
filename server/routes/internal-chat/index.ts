import { Express, Request, Response } from 'express';
import channelsRouter from './routes/channels';
import messagesRouter from './routes/messages';
import { getUserPermissions } from './services/permissions';

export function registerTeamsIntegratedChatRoutes(app: Express) {
  // Rotas de canais
  app.use('/api/internal-chat/channels', channelsRouter);

  // Rotas de mensagens
  app.use('/api/internal-chat/channels', messagesRouter);

  // Rota de permissões
  app.get('/api/internal-chat/permissions', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  console.log('✅ Chat interno integrado com sistema de equipes e usuários');
} 