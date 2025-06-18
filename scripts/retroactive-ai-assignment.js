/**
 * Script para atualizar retroativamente atribuições de conversas com base na análise de IA
 * Analisa conversas existentes e atualiza equipes automaticamente
 */

const { db } = require('../server/db');
const { conversations, messages, teams } = require('../shared/schema');
const { eq, and, isNull, isNotNull, desc, asc } = require('drizzle-orm');

class RetroactiveAIAssignment {
  constructor() {
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errors = [];
  }

  /**
   * Analisa o conteúdo da conversa usando padrões simples de IA
   */
  analyzeConversationContent(messages) {
    if (!messages || messages.length === 0) {
      return { teamType: null, confidence: 0, reason: 'Sem mensagens para análise' };
    }

    const allContent = messages.map(m => m.content?.toLowerCase() || '').join(' ');
    
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

    let bestMatch = { teamType: null, score: 0, matchedWords: [] };

    for (const [teamType, keywords] of Object.entries(patterns)) {
      let score = 0;
      const matchedWords = [];

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
      teamType: bestMatch.teamType,
      confidence,
      reason: bestMatch.matchedWords.length > 0 
        ? `Palavras-chave encontradas: ${bestMatch.matchedWords.join(', ')}`
        : 'Nenhuma palavra-chave específica encontrada'
    };
  }

  /**
   * Busca equipe por tipo
   */
  async getTeamByType(teamType) {
    if (!teamType) return null;

    const team = await db
      .select()
      .from(teams)
      .where(and(
        eq(teams.teamType, teamType),
        eq(teams.isActive, true)
      ))
      .limit(1);

    return team[0] || null;
  }

  /**
   * Processa uma única conversa
   */
  async processConversation(conversation) {
    try {
      this.processedCount++;
      
      // Buscar mensagens da conversa
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(asc(messages.createdAt));

      // Analisar conteúdo
      const analysis = this.analyzeConversationContent(conversationMessages);
      
      // Se não conseguiu determinar equipe ou confiança muito baixa, pular
      if (!analysis.teamType || analysis.confidence < 40) {
        console.log(`⚠️ Conversa ${conversation.id}: ${analysis.reason} (confiança: ${analysis.confidence}%)`);
        return;
      }

      // Buscar equipe correspondente
      const targetTeam = await this.getTeamByType(analysis.teamType);
      if (!targetTeam) {
        console.log(`⚠️ Conversa ${conversation.id}: Equipe '${analysis.teamType}' não encontrada`);
        return;
      }

      // Verificar se já está na equipe correta
      if (conversation.assignedTeamId === targetTeam.id) {
        console.log(`✅ Conversa ${conversation.id}: Já atribuída à equipe correta (${targetTeam.name})`);
        return;
      }

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

      this.updatedCount++;
      console.log(`🤖 Conversa ${conversation.id}: Atribuída à ${targetTeam.name} (confiança: ${analysis.confidence}%)`);
      console.log(`   Razão: ${analysis.reason}`);

    } catch (error) {
      this.errors.push({ conversationId: conversation.id, error: error.message });
      console.error(`❌ Erro ao processar conversa ${conversation.id}:`, error.message);
    }
  }

  /**
   * Executa o processo de atribuição retroativa
   */
  async run(options = {}) {
    const {
      batchSize = 50,
      maxConversations = null,
      onlyUnassigned = true,
      minConfidence = 40
    } = options;

    console.log('🤖 Iniciando análise retroativa de conversas com IA...');
    console.log(`📋 Configurações:`, {
      batchSize,
      maxConversations,
      onlyUnassigned,
      minConfidence
    });

    try {
      // Construir query base
      let query = db.select().from(conversations);
      
      if (onlyUnassigned) {
        query = query.where(isNull(conversations.assignedTeamId));
      }

      // Aplicar limite se especificado
      if (maxConversations) {
        query = query.limit(maxConversations);
      }

      // Ordenar por mais recente primeiro
      query = query.orderBy(desc(conversations.createdAt));

      const conversationsToProcess = await query;
      
      console.log(`📊 Encontradas ${conversationsToProcess.length} conversas para processar`);

      // Processar em lotes
      for (let i = 0; i < conversationsToProcess.length; i += batchSize) {
        const batch = conversationsToProcess.slice(i, i + batchSize);
        
        console.log(`\n🔄 Processando lote ${Math.floor(i / batchSize) + 1} (${batch.length} conversas)...`);
        
        // Processar conversas do lote em paralelo
        await Promise.all(
          batch.map(conversation => this.processConversation(conversation))
        );

        // Pausa breve entre lotes para não sobrecarregar o sistema
        if (i + batchSize < conversationsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Relatório final
      console.log('\n📊 Relatório Final:');
      console.log(`✅ Conversas processadas: ${this.processedCount}`);
      console.log(`🔄 Conversas atualizadas: ${this.updatedCount}`);
      console.log(`❌ Erros encontrados: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\n❌ Detalhes dos erros:');
        this.errors.forEach(error => {
          console.log(`   Conversa ${error.conversationId}: ${error.error}`);
        });
      }

      const successRate = this.processedCount > 0 
        ? Math.round((this.updatedCount / this.processedCount) * 100)
        : 0;
      
      console.log(`\n🎯 Taxa de sucesso: ${successRate}% das conversas foram reatribuídas`);

    } catch (error) {
      console.error('❌ Erro crítico durante execução:', error);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  async function main() {
    const assignment = new RetroactiveAIAssignment();
    
    try {
      // Configurações padrão - processar apenas conversas não atribuídas
      await assignment.run({
        batchSize: 25,
        maxConversations: 100, // Processar apenas 100 conversas por vez
        onlyUnassigned: true,
        minConfidence: 40
      });
      
      console.log('\n✅ Processo concluído com sucesso!');
    } catch (error) {
      console.error('\n❌ Falha na execução:', error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  }

  main();
}

module.exports = { RetroactiveAIAssignment };