import { db } from '../db.js';
import { conversations, messages, teams } from '../../shared/schema.js';
import { eq, isNull, desc } from 'drizzle-orm';

/**
 * Serviço de atribuição automática imediata com IA
 * Processa uma conversa específica assim que uma mensagem chega
 */

const teamKeywords = {
  'comercial': [
    'comprar', 'preço', 'valor', 'custo', 'orçamento', 'pagamento', 
    'desconto', 'promoção', 'oferta', 'venda', 'investimento', 'compra',
    'quanto custa', 'qual o valor', 'parcelamento', 'cartão', 'boleto',
    'vendas', 'comercial', 'negócio', 'interesse', 'quero', 'queria',
    'mensalidade', 'matricula'
  ],
  'suporte': [
    'problema', 'erro', 'bug', 'não funciona', 'não consegue', 'dificuldade',
    'ajuda', 'suporte', 'socorro', 'dúvida técnica', 'como fazer', 'não sei',
    'travou', 'parou', 'quebrado', 'defeito', 'falha', 'técnico',
    'configurar', 'instalar', 'tutorial', 'não consigo'
  ],
  'secretaria': [
    'informação', 'horário', 'funcionamento', 'localização', 'endereço',
    'contato', 'telefone', 'email', 'whatsapp', 'atendimento',
    'quando', 'onde', 'como funciona', 'geral', 'informações',
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

function analyzeMessageContent(messageContent: string): {
  teamType: string;
  confidence: number;
  reason: string;
} {
  const content = messageContent.toLowerCase();
  
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
  const confidence = Math.min(bestMatch.score * 25, 100); // Max 100%
  
  return {
    teamType: bestMatch.teamType || 'comercial',
    confidence,
    reason: bestMatch.matchedWords.length > 0 
      ? `Palavras-chave: ${bestMatch.matchedWords.join(', ')}`
      : 'Análise geral - direcionado para comercial'
  };
}

/**
 * Processa uma conversa específica imediatamente
 */
export async function processConversationImmediately(conversationId: number, messageContent: string): Promise<{
  success: boolean;
  assigned: boolean;
  teamType?: string;
  confidence?: number;
  reason?: string;
  error?: string;
}> {
  try {
    console.log(`🤖 Análise imediata IA para conversa ${conversationId}: "${messageContent.substring(0, 50)}..."`);

    // Verificar se a conversa já tem equipe atribuída
    const conversation = await db
      .select({
        id: conversations.id,
        assignedTeamId: conversations.assignedTeamId
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return { success: false, assigned: false, error: 'Conversa não encontrada' };
    }

    if (conversation[0].assignedTeamId) {
      console.log(`⚠️ Conversa ${conversationId} já possui equipe atribuída`);
      return { success: true, assigned: false, reason: 'Conversa já atribuída' };
    }

    // Analisar conteúdo da mensagem
    const analysis = analyzeMessageContent(messageContent);

    // Verificar confiança mínima
    if (analysis.confidence < 30) {
      console.log(`⚠️ Confiança baixa (${analysis.confidence}%) para conversa ${conversationId}`);
      return { 
        success: true, 
        assigned: false, 
        confidence: analysis.confidence,
        reason: 'Confiança abaixo do mínimo (30%)'
      };
    }

    // Mapear tipos de análise para team_type do banco
    const teamTypeMapping: Record<string, string> = {
      'comercial': 'comercial',
      'suporte': 'suporte', 
      'secretaria': 'secretaria',
      'tutoria': 'tutoria',
      'financeiro': 'financeiro'
    };

    const dbTeamType = teamTypeMapping[analysis.teamType] || 'comercial';

    // Buscar equipe correspondente
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.teamType, dbTeamType))
      .limit(1);

    if (team.length === 0) {
      console.log(`⚠️ Equipe '${analysis.teamType}' não encontrada`);
      return { 
        success: false, 
        assigned: false, 
        error: `Equipe ${analysis.teamType} não encontrada` 
      };
    }

    // Atribuir conversa à equipe
    await db
      .update(conversations)
      .set({ 
        assignedTeamId: team[0].id,
        teamType: analysis.teamType,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));

    console.log(`✅ Conversa ${conversationId} atribuída à equipe ${analysis.teamType} (${analysis.confidence}% confiança)`);

    return {
      success: true,
      assigned: true,
      teamType: analysis.teamType,
      confidence: analysis.confidence,
      reason: analysis.reason
    };

  } catch (error) {
    console.error(`❌ Erro na análise imediata da conversa ${conversationId}:`, error);
    return {
      success: false,
      assigned: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Processa uma conversa apenas se ela não tiver equipe atribuída
 */
export async function autoAssignIfNeeded(conversationId: number, messageContent: string): Promise<void> {
  try {
    // Executar em background para não bloquear
    setImmediate(async () => {
      const result = await processConversationImmediately(conversationId, messageContent);
      
      if (result.assigned) {
        console.log(`🎯 Atribuição automática bem-sucedida: Conversa ${conversationId} → ${result.teamType}`);
      }
    });
  } catch (error) {
    console.error(`❌ Erro no processamento automático:`, error);
  }
}