import { Router } from 'express';
import { db } from '../../db';
import { conversations, messages, teams } from '../../../shared/schema';
import { eq, isNull, desc, asc, count } from 'drizzle-orm';

const router = Router();

// Configuração de palavras-chave por tipo de equipe
const teamKeywords = {
  'comercial': [
    'comprar', 'preço', 'valor', 'custo', 'orçamento', 'pagamento', 
    'desconto', 'promoção', 'oferta', 'venda', 'investimento', 'compra',
    'quanto custa', 'qual o valor', 'parcelamento', 'cartão', 'boleto',
    'vendas', 'comercial', 'negócio', 'interesse', 'quero', 'queria'
  ],
  'suporte': [
    'problema', 'erro', 'bug', 'não funciona', 'não consegue', 'dificuldade',
    'ajuda', 'suporte', 'socorro', 'dúvida', 'como fazer', 'não sei',
    'travou', 'parou', 'quebrado', 'defeito', 'falha', 'técnico',
    'configurar', 'instalar', 'tutorial'
  ],
  'secretaria': [
    'informação', 'horário', 'funcionamento', 'localização', 'endereço',
    'contato', 'telefone', 'email', 'whatsapp', 'atendimento',
    'quando', 'onde', 'como', 'geral', 'informações', 'como funciona',
    'certificação', 'documentação', 'pós-graduação', 'graduação', 'curso'
  ],
  'tutoria': [
    'estudando', 'estudo', 'matéria', 'disciplina', 'aula', 'professor',
    'tutor', 'dúvida acadêmica', 'atividade', 'trabalho', 'prova',
    'nota', 'avaliação', 'conteúdo', 'material'
  ],
  'financeiro': [
    'mensalidade', 'boleto', 'pagamento', 'financeiro', 'cobrança',
    'desconto', 'bolsa', 'financiamento', 'parcelamento', 'débito',
    'conta', 'fatura', 'valor devido'
  ]
};

/**
 * Análise simples de IA para classificação de conversas
 */
function analyzeConversationContent(messageList: any[]) {
  const allText = messageList
    .filter(msg => msg.content && typeof msg.content === 'string')
    .map(msg => msg.content.toLowerCase())
    .join(' ');

  // Análise por palavras-chave
  const teamScores = Object.entries(teamKeywords).map(([teamType, keywords]) => {
    const matchedWords: string[] = [];
    let score = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        score += matches.length;
        matchedWords.push(keyword);
      }
    });
    
    return { teamType, score, matchedWords };
  });

  // Encontrar melhor match
  const bestMatch = teamScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  // Calcular confiança baseada na quantidade de matches
  const confidence = Math.min(bestMatch.score * 20, 100); // Max 100%
  
  return {
    teamType: bestMatch.teamType || 'comercial',
    confidence,
    reason: bestMatch.matchedWords.length > 0 
      ? `Palavras-chave encontradas: ${bestMatch.matchedWords.join(', ')}`
      : 'Análise baseada em contexto geral - direcionado para comercial'
  };
}

/**
 * POST /api/admin/retroactive-assignment
 * Executa análise retroativa e atribui conversas baseado em IA
 */
router.post('/retroactive-assignment', async (req, res) => {
  try {
    const { 
      maxConversations = 50, 
      onlyUnassigned = true, 
      minConfidence = 60,
      dryRun = false 
    } = req.body;

    console.log(`🔄 Iniciando atribuição retroativa com IA:`);
    console.log(`   - Máximo de conversas: ${maxConversations}`);
    console.log(`   - Apenas não atribuídas: ${onlyUnassigned}`);
    console.log(`   - Confiança mínima: ${minConfidence}%`);
    console.log(`   - Modo simulação: ${dryRun}`);

    // Buscar conversas para processar
    const conversationsQuery = db.select().from(conversations);
    
    const conversationsToProcess = onlyUnassigned 
      ? await conversationsQuery
          .where(isNull(conversations.assignedTeamId))
          .limit(maxConversations)
          .orderBy(desc(conversations.createdAt))
      : await conversationsQuery
          .limit(maxConversations)
          .orderBy(desc(conversations.createdAt));

    console.log(`📊 Encontradas ${conversationsToProcess.length} conversas para processar`);

    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[],
      assignments: [] as any[],
      successRate: 0,
      dryRun
    };

    // Processar cada conversa
    for (const conversation of conversationsToProcess) {
      try {
        results.processed++;

        // Buscar mensagens da conversa
        const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(asc(messages.sentAt), asc(messages.id));

        // Analisar conteúdo
        const analysis = analyzeConversationContent(conversationMessages);
        
        // Verificar se atende aos critérios de confiança
        if (analysis.confidence < minConfidence) {
          results.skipped++;
          continue;
        }

        // Buscar equipe correspondente
        const team = await db
          .select()
          .from(teams)
          .where(eq(teams.teamType, analysis.teamType))
          .limit(1);

        if (team.length === 0) {
          results.skipped++;
          continue;
        }

        const assignment = {
          conversationId: conversation.id,
          fromTeam: conversation.assignedTeamId,
          toTeam: team[0].id,
          teamType: analysis.teamType,
          confidence: analysis.confidence,
          reason: analysis.reason,
          messageCount: conversationMessages.length
        };

        results.assignments.push(assignment);

        // Aplicar mudanças se não for simulação
        if (!dryRun) {
          await db
            .update(conversations)
            .set({ 
              assignedTeamId: team[0].id,
              teamType: analysis.teamType,
              updatedAt: new Date()
            })
            .where(eq(conversations.id, conversation.id));

          console.log(`✅ Conversa ${conversation.id} atribuída à equipe ${analysis.teamType} (${analysis.confidence}% confiança)`);
        }

        results.updated++;

      } catch (error) {
        console.error(`❌ Erro ao processar conversa ${conversation.id}:`, error);
        results.errors.push({
          conversationId: conversation.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Calcular taxa de sucesso
    results.successRate = results.processed > 0 
      ? Math.round((results.updated / results.processed) * 100)
      : 0;

    console.log(`📈 Atribuição retroativa concluída:`);
    console.log(`   - Processadas: ${results.processed}`);
    console.log(`   - Atualizadas: ${results.updated}`);
    console.log(`   - Ignoradas: ${results.skipped}`);
    console.log(`   - Erros: ${results.errors.length}`);
    console.log(`   - Taxa de sucesso: ${results.successRate}%`);

    return res.json(results);
  } catch (error) {
    console.error('❌ Erro na atribuição retroativa:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/admin/retroactive-assignment/preview
 * Prévia da análise sem fazer alterações
 */
router.get('/retroactive-assignment/preview', async (req, res) => {
  try {
    const { 
      maxConversations = 10, 
      onlyUnassigned = true 
    } = req.query;

    console.log(`🔍 Gerando prévia da atribuição retroativa:`);
    console.log(`   - Máximo de conversas: ${maxConversations}`);
    console.log(`   - Apenas não atribuídas: ${onlyUnassigned}`);

    // Buscar conversas para analisar
    const conversationsQuery = db.select().from(conversations);
    
    const conversationsToAnalyze = onlyUnassigned === 'true'
      ? await conversationsQuery
          .where(isNull(conversations.assignedTeamId))
          .limit(Number(maxConversations))
          .orderBy(desc(conversations.createdAt))
      : await conversationsQuery
          .limit(Number(maxConversations))
          .orderBy(desc(conversations.createdAt));

    const previews = [];

    // Analisar cada conversa sem fazer alterações
    for (const conversation of conversationsToAnalyze) {
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(asc(messages.sentAt), asc(messages.id));

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

    const summary = {
      total: previews.length,
      highConfidence: previews.filter(p => p.confidence >= 80).length,
      mediumConfidence: previews.filter(p => p.confidence >= 50 && p.confidence < 80).length,
      lowConfidence: previews.filter(p => p.confidence < 50).length,
      avgConfidence: previews.length > 0 
        ? Math.round(previews.reduce((sum, p) => sum + p.confidence, 0) / previews.length)
        : 0
    };

    console.log(`📊 Prévia gerada: ${previews.length} conversas analisadas`);

    return res.json({ previews, summary });
  } catch (error) {
    console.error('❌ Erro na prévia de atribuição retroativa:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;