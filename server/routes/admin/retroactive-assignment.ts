import { Router } from 'express';
import { db } from '../../db';
import { conversations, messages, teams } from '@shared/schema';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { broadcast } from '../realtime/realtime-broadcast';

const router = Router();

/**
 * Análise simples de IA para classificação de conversas
 */
function analyzeConversationContent(messageList: any[]) {
  if (!messageList || messageList.length === 0) {
    return { teamType: null, confidence: 0, reason: 'Sem mensagens para análise' };
  }

  const allContent = messageList.map(m => m.content?.toLowerCase() || '').join(' ');
  
  // Padrões para diferentes tipos de equipe
  const patterns = {
    comercial: [
      'preço', 'valor', 'custo', 'investimento', 'comprar', 'venda', 'vendas',
      'desconto', 'promoção', 'pagamento', 'parcelamento', 'orçamento',
      'curso', 'matrícula', 'inscrição', 'interessado', 'interesse'
    ],
    suporte: [
      'problema', 'erro', 'bug', 'não funciona', 'ajuda', 'suporte',
      'dificuldade', 'dúvida técnica', 'acesso', 'login', 'senha',
      'plataforma', 'sistema', 'site não abre'
    ],
    financeiro: [
      'boleto', 'cobrança', 'fatura', 'inadimplente', 'atraso',
      'pagamento', 'débito', 'conta', 'financeiro', 'mensalidade',
      'negociar', 'parcelar', 'desconto pagamento'
    ],
    secretaria: [
      'certificado', 'diploma', 'histórico', 'documentação', 'documento',
      'atestado', 'declaração', 'comprovante', 'segunda via',
      'secretaria', 'acadêmico'
    ],
    tutoria: [
      'dúvida', 'matéria', 'conteúdo', 'aula', 'professor', 'tutor',
      'atividade', 'prova', 'exercício', 'estudo', 'aprendizado',
      'disciplina', 'módulo'
    ]
  };

  let bestMatch = { teamType: null, score: 0, matchedWords: [] as string[] };

  for (const [teamType, keywords] of Object.entries(patterns)) {
    let score = 0;
    const matchedWords: string[] = [];

    for (const keyword of keywords) {
      if (allContent.includes(keyword)) {
        score++;
        matchedWords.push(keyword);
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { teamType, score, matchedWords };
    }
  }

  // Calcular confiança baseada na quantidade de matches
  const confidence = Math.min(bestMatch.score * 20, 100); // Max 100%
  
  return {
    teamType: bestMatch.teamType || null,
    confidence,
    reason: bestMatch.matchedWords.length > 0 
      ? `Palavras-chave encontradas: ${bestMatch.matchedWords.join(', ')}`
      : 'Nenhuma palavra-chave específica encontrada'
  };
}

/**
 * POST /api/admin/retroactive-assignment
 * Executa análise retroativa e atribui conversas baseado em IA
 */
router.post('/', async (req, res) => {
  try {
    const { 
      maxConversations = 50, 
      onlyUnassigned = true,
      minConfidence = 40,
      dryRun = false 
    } = req.body;

    console.log('🤖 Iniciando análise retroativa de conversas...');

    // Buscar conversas para processar
    let query = db.select().from(conversations);
    
    if (onlyUnassigned) {
      query = query.where(isNull(conversations.assignedTeamId));
    }

    const conversationsToProcess = await query
      .limit(maxConversations)
      .orderBy(desc(conversations.createdAt))
      .execute();

    console.log(`📊 Encontradas ${conversationsToProcess.length} conversas para processar`);

    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[],
      assignments: [] as any[]
    };

    // Buscar todas as equipes ativas
    const activeTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.isActive, true));

    const teamMap = new Map(activeTeams.map(team => [team.teamType, team]));

    // Processar cada conversa
    for (const conversation of conversationsToProcess) {
      try {
        results.processed++;

        // Buscar mensagens da conversa
        const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(asc(messages.sentAt));

        // Analisar conteúdo
        const analysis = analyzeConversationContent(conversationMessages);
        
        // Se não conseguiu determinar equipe ou confiança muito baixa, pular
        if (!analysis.teamType || analysis.confidence < minConfidence) {
          results.skipped++;
          console.log(`⚠️ Conversa ${conversation.id}: ${analysis.reason} (confiança: ${analysis.confidence}%)`);
          continue;
        }

        // Buscar equipe correspondente
        const targetTeam = teamMap.get(analysis.teamType);
        if (!targetTeam) {
          results.skipped++;
          console.log(`⚠️ Conversa ${conversation.id}: Equipe '${analysis.teamType}' não encontrada`);
          continue;
        }

        // Verificar se já está na equipe correta
        if (conversation.assignedTeamId === targetTeam.id) {
          results.skipped++;
          console.log(`✅ Conversa ${conversation.id}: Já atribuída à equipe correta (${targetTeam.name})`);
          continue;
        }

        const assignmentInfo = {
          conversationId: conversation.id,
          fromTeam: conversation.assignedTeamId,
          toTeam: targetTeam.id,
          teamName: targetTeam.name,
          confidence: analysis.confidence,
          reason: analysis.reason
        };

        if (!dryRun) {
          // Atualizar conversa
          await db
            .update(conversations)
            .set({
              assignedTeamId: targetTeam.id,
              teamType: analysis.teamType,
              assignmentMethod: 'ai_retroactive',
              updatedAt: new Date()
            })
            .where(eq(conversations.id, conversation.id));

          // Notificar via WebSocket sobre a mudança
          broadcast(conversation.id, {
            type: 'conversation_assignment_updated',
            conversationId: conversation.id,
            assignedTeamId: targetTeam.id,
            assignmentMethod: 'ai_retroactive',
            updatedAt: new Date().toISOString()
          });

          results.updated++;
          console.log(`🤖 Conversa ${conversation.id}: Atribuída à ${targetTeam.name} (confiança: ${analysis.confidence}%)`);
        } else {
          console.log(`🔍 [DRY RUN] Conversa ${conversation.id}: Seria atribuída à ${targetTeam.name} (confiança: ${analysis.confidence}%)`);
        }

        results.assignments.push(assignmentInfo);

      } catch (error) {
        results.errors.push({ 
          conversationId: conversation.id, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
        console.error(`❌ Erro ao processar conversa ${conversation.id}:`, error);
      }
    }

    // Calcular taxa de sucesso
    const successRate = results.processed > 0 
      ? Math.round((results.updated / results.processed) * 100)
      : 0;

    const summary = {
      ...results,
      successRate,
      dryRun
    };

    console.log('\n📊 Relatório Final:');
    console.log(`✅ Conversas processadas: ${results.processed}`);
    console.log(`🔄 Conversas atualizadas: ${results.updated}`);
    console.log(`⏭️ Conversas ignoradas: ${results.skipped}`);
    console.log(`❌ Erros encontrados: ${results.errors.length}`);
    console.log(`🎯 Taxa de sucesso: ${successRate}%`);

    res.json({
      success: true,
      message: dryRun 
        ? 'Análise concluída (simulação - nenhuma alteração foi feita)'
        : 'Análise retroativa concluída com sucesso',
      data: summary
    });

  } catch (error) {
    console.error('❌ Erro na análise retroativa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/admin/retroactive-assignment/preview
 * Prévia da análise sem fazer alterações
 */
router.get('/preview', async (req, res) => {
  try {
    const maxConversations = parseInt(req.query.maxConversations as string) || 10;
    const onlyUnassigned = req.query.onlyUnassigned === 'true';

    // Buscar conversas para análise
    let query = db.select().from(conversations);
    
    if (onlyUnassigned) {
      query = query.where(isNull(conversations.assignedTeamId));
    }

    const conversationsToAnalyze = await query
      .limit(maxConversations)
      .orderBy(desc(conversations.createdAt))
      .execute();

    const previews = [];

    // Analisar cada conversa sem fazer alterações
    for (const conversation of conversationsToAnalyze) {
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(asc(messages.sentAt));

      const analysis = analyzeConversationContent(conversationMessages);
      
      previews.push({
        conversationId: conversation.id,
        currentTeamId: conversation.assignedTeamId,
        suggestedTeamType: analysis.teamType,
        confidence: analysis.confidence,
        reason: analysis.reason,
        messageCount: conversationMessages.length
      });
    }

    res.json({
      success: true,
      data: {
        totalAnalyzed: previews.length,
        previews
      }
    });

  } catch (error) {
    console.error('❌ Erro na prévia de análise:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;