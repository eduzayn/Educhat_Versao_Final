import { Express, Request, Response } from 'express';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../core/db';
import { 
  systemUsers,
  teams,
  userTeams,
  roles
} from '../../../shared/schema';

// Usando interface padrão do Express sem extensão

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'internal-chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Aceitar todos os tipos de arquivo por enquanto
    cb(null, true);
  }
});

// Sistema de chat interno integrado com equipes e usuários existentes
export function registerTeamsIntegratedChatRoutes(app: Express) {

  // Verificar permissões do usuário baseado no sistema existente
  async function getUserPermissions(userId: number) {
    const userWithRole = await db
      .select({
        id: systemUsers.id,
        username: systemUsers.username,
        displayName: systemUsers.displayName,
        roleId: systemUsers.roleId,
        roleName: roles.name
      })
      .from(systemUsers)
      .leftJoin(roles, eq(systemUsers.roleId, roles.id))
      .where(eq(systemUsers.id, userId))
      .limit(1);
    
    if (!userWithRole[0]) {
      return { canViewAll: false, canViewTeams: false, canViewPrivate: false, isAdmin: false, isManager: false };
    }
    
    const roleName = userWithRole[0].roleName || '';
    const isAdmin = roleName === 'Administrador' || roleName === 'Admin';
    const isManager = roleName === 'Gerente' || roleName === 'Gestor';
    
    return {
      canViewAll: isAdmin || isManager,
      canViewTeams: true,
      canViewPrivate: isAdmin || isManager,
      isAdmin,
      isManager,
      user: userWithRole[0]
    };
  }

  // Endpoint para buscar canais baseados nas equipes do usuário
  app.get('/api/internal-chat/channels', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      let channels = [];

      if (permissions.canViewAll) {
        // Admin/Gestor vê todas as equipes
        const allTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            description: teams.description,
          })
          .from(teams)
          .orderBy(teams.name);
        
        channels = [
          {
            id: 'general',
            name: 'Geral',
            description: 'Canal geral da empresa',
            type: 'general',
            isPrivate: false,
            participants: [],
            unreadCount: 0
          },
          ...allTeams.map(team => ({
            id: `team-${team.id}`,
            name: team.name,
            description: team.description || `Discussões da ${team.name}`,
            type: 'team',
            teamId: team.id,
            isPrivate: false,
            participants: [],
            unreadCount: 0
          }))
        ];
      } else {
        // Usuários comuns só veem suas equipes
        const userTeamIds = await db
          .select({ 
            teamId: userTeams.teamId,
            teamName: teams.name,
            teamDescription: teams.description
          })
          .from(userTeams)
          .leftJoin(teams, eq(userTeams.teamId, teams.id))
          .where(eq(userTeams.userId, req.user.id));
        
        channels = [
          {
            id: 'general',
            name: 'Geral',
            description: 'Canal geral da empresa',
            type: 'general',
            isPrivate: false,
            participants: [],
            unreadCount: 0
          },
          ...userTeamIds.map(ut => ({
            id: `team-${ut.teamId}`,
            name: ut.teamName || 'Equipe',
            description: ut.teamDescription || `Discussões da equipe`,
            type: 'team',
            teamId: ut.teamId,
            isPrivate: false,
            participants: [],
            unreadCount: 0
          }))
        ];
      }
      
      res.json(channels);
    } catch (error) {
      console.error('Erro ao buscar canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar usuários da equipe/canal
  app.get('/api/internal-chat/channels/:channelId/users', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const channelId = req.params.channelId;
      
      if (channelId === 'general') {
        // Canal geral - todos os usuários
        const allUsers = await db
          .select({
            id: systemUsers.id,
            username: systemUsers.username,
            displayName: systemUsers.displayName,
            avatar: systemUsers.avatar,
            roleName: roles.name
          })
          .from(systemUsers)
          .leftJoin(roles, eq(systemUsers.roleId, roles.id))
          .where(eq(systemUsers.isActive, true))
          .orderBy(systemUsers.displayName);
        
        res.json(allUsers);
      } else if (channelId.startsWith('team-')) {
        // Canal de equipe específica
        const teamId = parseInt(channelId.replace('team-', ''));
        
        const teamUsers = await db
          .select({
            id: systemUsers.id,
            username: systemUsers.username,
            displayName: systemUsers.displayName,
            avatar: systemUsers.avatar,
            roleName: roles.name
          })
          .from(userTeams)
          .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
          .leftJoin(roles, eq(systemUsers.roleId, roles.id))
          .where(and(
            eq(userTeams.teamId, teamId),
            eq(systemUsers.isActive, true)
          ))
          .orderBy(systemUsers.displayName);
        
        res.json(teamUsers);
      } else {
        res.status(404).json({ error: 'Canal não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do canal:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para verificar permissões do usuário
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



  // Endpoint para buscar mensagens de um canal
  app.get('/api/internal-chat/channels/:channelId/messages', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const channelId = req.params.channelId;
      
      // Por enquanto, retornar array vazio - mensagens serão implementadas via Socket.IO
      res.json([]);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para enviar mensagem em um canal
  app.post('/api/internal-chat/channels/:channelId/messages', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const channelId = req.params.channelId;
      const { content, messageType = 'text' } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      }

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channelId,
        userId: req.user.id,
        userName: req.user.displayName || req.user.username,
        userAvatar: (req.user as any).avatar,
        content: content.trim(),
        messageType,
        timestamp: new Date(),
        reactions: {}
      };

      // Broadcast da mensagem via Socket.IO seria implementado aqui
      console.log(`📨 Nova mensagem no canal ${channelId}:`, message);

      res.json({ success: true, message });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Função para criar automaticamente canal de equipe quando uma nova equipe é criada
  async function createTeamChannel(teamId: number, teamName: string, teamDescription?: string) {
    try {
      console.log(`🏗️ Criando canal automático para equipe ${teamName} (ID: ${teamId})`);
      
      // Esta função seria chamada quando uma nova equipe é criada
      // O canal é criado dinamicamente quando as equipes são consultadas
      
      const channelData = {
        id: `team-${teamId}`,
        name: teamName,
        description: teamDescription || `Discussões da ${teamName}`,
        type: 'team',
        teamId: teamId,
        isPrivate: false,
        participants: [],
        unreadCount: 0
      };

      console.log(`✅ Canal criado automaticamente: ${channelData.name}`);
      return channelData;
    } catch (error) {
      console.error('❌ Erro ao criar canal de equipe:', error);
      throw error;
    }
  }

  // Exportar função para uso em outras partes do sistema
  (global as any).createTeamChannel = createTeamChannel;

  console.log('✅ Chat interno integrado com sistema de equipes e usuários');
}