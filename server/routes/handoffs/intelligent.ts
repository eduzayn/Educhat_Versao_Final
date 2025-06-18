import { Router } from 'express';
import { db } from '../../core/db';
import { conversations, teams, systemUsers, userTeams } from '../../../shared/schema';
import { eq, and, count, desc } from 'drizzle-orm';

const router = Router();

// POST /api/handoffs/intelligent/execute - Executa atribuição inteligente
router.post('/execute', async (req, res) => {
  try {
    const { conversationId, messageContent, type } = req.body;
    
    if (!conversationId || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'conversationId e messageContent são obrigatórios'
      });
    }
    
    console.log(`🎯 Executando atribuição inteligente para conversa ${conversationId}`);
    
    // Verificar se conversa já está atribuída
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    if (conversation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversa não encontrada'
      });
    }
    
    const conv = conversation[0];
    
    // Se já está atribuída, não fazer nada
    if (conv.assignedUserId && conv.assignedTeamId) {
      return res.json({
        success: true,
        handoffCreated: false,
        reason: 'Conversa já atribuída',
        assignedUserId: conv.assignedUserId,
        assignedTeamId: conv.assignedTeamId
      });
    }
    
    // Determinar tipo de equipe baseado no conteúdo
    const teamType = determineTeamType(messageContent);
    
    // Buscar equipe ativa deste tipo
    const team = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.teamType, teamType),
          eq(teams.isActive, true)
        )
      )
      .limit(1);
    
    if (team.length === 0) {
      return res.json({
        success: true,
        handoffCreated: false,
        reason: `Nenhuma equipe ativa encontrada para tipo: ${teamType}`
      });
    }
    
    const selectedTeam = team[0];
    
    // Buscar usuário disponível na equipe usando round-robin simples
    const availableUsers = await getAvailableTeamUsers(selectedTeam.id);
    
    if (availableUsers.length === 0) {
      return res.json({
        success: true,
        handoffCreated: false,
        reason: `Nenhum usuário ativo encontrado na equipe ${selectedTeam.name}`
      });
    }
    
    // Selecionar usuário com menos conversas ativas
    const selectedUser = availableUsers[0];
    
    // Atualizar conversa
    await db
      .update(conversations)
      .set({
        assignedUserId: selectedUser.userId,
        assignedTeamId: selectedTeam.id,
        teamType: teamType,
        assignmentMethod: 'auto_intelligent',
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
    
    console.log(`✅ Conversa ${conversationId} atribuída para ${selectedUser.displayName} da equipe ${selectedTeam.name}`);
    
    res.json({
      success: true,
      handoffCreated: true,
      assignedUserId: selectedUser.userId,
      assignedTeamId: selectedTeam.id,
      recommendation: {
        confidence: 85,
        reason: `Atribuída automaticamente para equipe ${teamType} baseado no conteúdo da mensagem`,
        teamName: selectedTeam.name,
        userName: selectedUser.displayName
      }
    });
    
  } catch (error) {
    console.error('Erro na atribuição inteligente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Determina o tipo de equipe baseado no conteúdo da mensagem
 */
function determineTeamType(messageContent: string): string {
  const content = messageContent.toLowerCase();
  
  // Palavras-chave para diferentes equipes
  const teamKeywords = {
    'comercial': ['preço', 'valor', 'comprar', 'vender', 'orçamento', 'proposta', 'interesse', 'produto', 'curso', 'informação'],
    'suporte': ['problema', 'erro', 'não funciona', 'ajuda', 'dificuldade', 'suporte', 'técnico'],
    'financeiro': ['pagamento', 'boleto', 'pix', 'cartão', 'financeiro', 'cobrança', 'fatura'],
    'secretaria': ['horário', 'agenda', 'contato', 'telefone', 'endereço'],
    'tutoria': ['dúvida', 'exercício', 'matéria', 'aula', 'explicação', 'tutorial']
  };
  
  // Pontuação por tipo de equipe
  const scores: { [key: string]: number } = {};
  
  for (const [teamType, keywords] of Object.entries(teamKeywords)) {
    scores[teamType] = keywords.filter(keyword => content.includes(keyword)).length;
  }
  
  // Retorna o tipo com maior pontuação, ou 'comercial' como padrão
  const bestMatch = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
  return bestMatch[1] > 0 ? bestMatch[0] : 'comercial';
}

/**
 * Busca usuários disponíveis de uma equipe para round-robin
 */
async function getAvailableTeamUsers(teamId: number): Promise<Array<{
  userId: number;
  displayName: string;
  isOnline: boolean;
  activeConversations: number;
}>> {
  try {
    // Buscar usuários ativos da equipe
    const teamUsers = await db
      .select({
        userId: systemUsers.id,
        displayName: systemUsers.displayName,
        isOnline: systemUsers.isOnline,
        isActive: systemUsers.isActive
      })
      .from(systemUsers)
      .innerJoin(userTeams, eq(systemUsers.id, userTeams.userId))
      .where(
        and(
          eq(userTeams.teamId, teamId),
          eq(systemUsers.status, 'active'),
          eq(systemUsers.isActive, true),
          eq(userTeams.isActive, true)
        )
      );
    
    // Contar conversas ativas para cada usuário
    const usersWithLoad = [];
    for (const user of teamUsers) {
      const activeConvs = await db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.assignedUserId, user.userId),
            eq(conversations.status, 'open')
          )
        );
      
      usersWithLoad.push({
        userId: user.userId,
        displayName: user.displayName,
        isOnline: user.isOnline || false,
        activeConversations: activeConvs[0]?.count || 0
      });
    }
    
    // Ordenar por carga (menos conversas primeiro) e depois por status online
    return usersWithLoad.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return b.isOnline ? 1 : -1; // Online primeiro
      }
      return a.activeConversations - b.activeConversations; // Menos carga primeiro
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários da equipe:', error);
    return [];
  }
}

export default router;