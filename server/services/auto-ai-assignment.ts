import { db } from '../db.js';
import { conversations, messages, teams } from '../../shared/schema.js';
import { eq, isNull, desc, count, and, gt } from 'drizzle-orm';

/**
 * Serviço de atribuição automática com IA
 * Processa conversas não atribuídas automaticamente
 */

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
function analyzeConversationContent(allMessages: string[]): {
  teamType: string;
  confidence: number;
  reason: string;
} {
  const content = allMessages.join(' ').toLowerCase();
  
  let bestMatch = {
    teamType: '',
    score: 0,
    matchedWords: [] as string[]
  };

  // Analisar cada tipo de equipe
  for (const [teamType, keywords] of Object.entries(teamKeywords)) {
    let score = 0;
    const matchedWords: string[] = [];

    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 1;
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
    teamType: bestMatch.teamType || 'comercial',
    confidence,
    reason: bestMatch.matchedWords.length > 0 
      ? `Palavras-chave encontradas: ${bestMatch.matchedWords.join(', ')}`
      : 'Análise baseada em contexto geral - direcionado para comercial'
  };
}

/**
 * Processa conversas não atribuídas automaticamente
 */
export async function processUnassignedConversations(options: {
  maxConversations?: number;
  minConfidence?: number;
  onlyRecent?: boolean;
  specificConversationId?: number;
} = {}) {
  const {
    maxConversations = 50,
    minConfidence = 30,
    onlyRecent = true,
    specificConversationId
  } = options;

  console.log(`🤖 Iniciando processamento automático de conversas não atribuídas...`);
  console.log(`   - Máximo: ${maxConversations} conversas`);
  console.log(`   - Confiança mínima: ${minConfidence}%`);
  console.log(`   - Apenas recentes: ${onlyRecent ? 'Sim' : 'Não'}`);

  const results = {
    processed: 0,
    assigned: 0,
    skipped: 0,
    errors: 0,
    assignments: [] as Array<{
      conversationId: number;
      teamType: string;
      confidence: number;
      reason: string;
    }>
  };

  try {
    // Buscar conversas não atribuídas
    let unassignedConversations;

    if (specificConversationId) {
      // Processar apenas uma conversa específica
      unassignedConversations = await db
        .select({
          id: conversations.id,
          createdAt: conversations.createdAt
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, specificConversationId),
            isNull(conversations.assignedTeamId)
          )
        )
        .limit(1);
    } else {
      // Buscar múltiplas conversas
      let baseQuery = db
        .select({
          id: conversations.id,
          createdAt: conversations.createdAt
        })
        .from(conversations)
        .where(isNull(conversations.assignedTeamId))
        .orderBy(desc(conversations.createdAt))
        .limit(maxConversations);

      // Filtro para conversas recentes (últimos 30 dias)  
      if (onlyRecent) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        baseQuery = db
          .select({
            id: conversations.id,
            createdAt: conversations.createdAt
          })
          .from(conversations)
          .where(
            and(
              isNull(conversations.assignedTeamId),
              gt(conversations.createdAt, thirtyDaysAgo)
            )
          )
          .orderBy(desc(conversations.createdAt))
          .limit(maxConversations);
      }

      unassignedConversations = await baseQuery;
    }

    console.log(`📊 Encontradas ${unassignedConversations.length} conversas para processar`);

    for (const conversation of unassignedConversations) {
      results.processed++;

      try {
        // Buscar mensagens da conversa
        const conversationMessages = await db
          .select({
            content: messages.content
          })
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(messages.sentAt, messages.id);

        const messageContents = conversationMessages
          .map(m => m.content)
          .filter(content => content && content.trim() !== '' && !content.startsWith('⚠️'));

        if (messageContents.length === 0) {
          results.skipped++;
          continue;
        }

        // Analisar conteúdo com IA
        const analysis = analyzeConversationContent(messageContents);

        // Verificar se atende ao critério de confiança
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

        // ISOLAMENTO: Atribuir conversa específica à equipe com WHERE explícito
        const updateResult = await db
          .update(conversations)
          .set({ 
            assignedTeamId: team[0].id,
            teamType: analysis.teamType,
            assignmentMethod: 'auto_ai',
            assignedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversation.id));

        console.log(`🔒 ISOLAMENTO AUTO-AI: Conversa ${conversation.id} atribuída individualmente à equipe ${team[0].id}`);

        results.assigned++;
        results.assignments.push({
          conversationId: conversation.id,
          teamType: analysis.teamType,
          confidence: analysis.confidence,
          reason: analysis.reason
        });

        console.log(`✅ Conversa ${conversation.id} atribuída à equipe ${analysis.teamType} (${analysis.confidence}% confiança)`);

      } catch (error) {
        console.error(`❌ Erro ao processar conversa ${conversation.id}:`, error);
        results.errors++;
      }
    }

    const successRate = results.processed > 0 ? (results.assigned / results.processed * 100).toFixed(1) : 0;
    
    console.log(`📈 Processamento automático concluído:`);
    console.log(`   - Processadas: ${results.processed}`);
    console.log(`   - Atribuídas: ${results.assigned}`);
    console.log(`   - Ignoradas: ${results.skipped}`);
    console.log(`   - Erros: ${results.errors}`);
    console.log(`   - Taxa de sucesso: ${successRate}%`);

    return results;

  } catch (error) {
    console.error('❌ Erro no processamento automático:', error);
    throw error;
  }
}

/**
 * Executa processamento automático em background
 */
export async function runAutoAssignmentTask() {
  try {
    console.log('🔄 Executando tarefa automática de atribuição de conversas...');
    
    const results = await processUnassignedConversations({
      maxConversations: 25,
      minConfidence: 30,
      onlyRecent: true
    });

    if (results.assigned > 0) {
      console.log(`🎯 Atribuição automática: ${results.assigned} conversas processadas com sucesso`);
    }

    return results;
  } catch (error) {
    console.error('❌ Erro na tarefa automática:', error);
    return null;
  }
}