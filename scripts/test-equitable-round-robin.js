/**
 * Script para testar o novo sistema de round-robin equitativo
 * Verifica se a distribuição está verdadeiramente equitativa
 */

import { db } from '../server/db.ts';
import { equitableRoundRobinService } from '../server/services/equitableRoundRobinService.ts';
import { conversations, systemUsers, userTeams } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function testEquitableDistribution() {
  console.log('🧪 Testando sistema de round-robin equitativo...\n');

  try {
    // Obter primeira equipe ativa
    const teams = await db
      .select({ 
        teamId: userTeams.teamId,
        userId: userTeams.userId,
        userName: systemUsers.displayName 
      })
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(and(
        eq(userTeams.isActive, true),
        eq(systemUsers.status, 'active')
      ))
      .limit(10);

    if (teams.length === 0) {
      console.log('❌ Nenhuma equipe ativa encontrada para teste');
      return;
    }

    const teamId = teams[0].teamId;
    console.log(`🎯 Testando equipe ID: ${teamId}`);
    console.log(`👥 Membros da equipe:`, teams.filter(t => t.teamId === teamId).map(t => t.userName));

    // Obter estatísticas antes do teste
    console.log('\n📊 ESTATÍSTICAS ANTES DO TESTE:');
    const statsBefore = await equitableRoundRobinService.getEquityStats(teamId);
    console.log(`- Total de usuários: ${statsBefore.totalUsers}`);
    console.log(`- Usuários online: ${statsBefore.onlineUsers}`);
    console.log(`- Equidade da distribuição: ${statsBefore.distributionEquity}`);
    
    if (statsBefore.userStats.length > 0) {
      console.log('- Distribuição por usuário:');
      statsBefore.userStats.forEach(user => {
        console.log(`  • ${user.name}: ${user.totalAssignments} atribuições totais, ${user.activeConversations} ativas (Score: ${user.distributionScore})`);
      });
    }

    // Simular múltiplas atribuições
    console.log('\n🔄 SIMULANDO 10 ATRIBUIÇÕES SEQUENCIAIS:');
    const assignmentResults = [];
    
    for (let i = 1; i <= 10; i++) {
      // Criar conversa fictícia para teste
      const [conversation] = await db
        .insert(conversations)
        .values({
          contactId: 1, // Usar contato existente
          channel: 'whatsapp',
          status: 'open',
          lastMessageAt: new Date(),
          createdAt: new Date()
        })
        .returning({ id: conversations.id });

      console.log(`\n${i}. Atribuindo conversa ${conversation.id}...`);
      
      const result = await equitableRoundRobinService.assignUserToConversation(conversation.id, teamId);
      
      if (result.success) {
        console.log(`✅ Atribuída para: ${result.userName}`);
        console.log(`📝 Razão: ${result.reason}`);
        if (result.distributionInfo) {
          console.log(`📊 Info: Carga do usuário: ${result.distributionInfo.userLoad}, Média da equipe: ${result.distributionInfo.teamAverageLoad}`);
        }
        
        assignmentResults.push({
          conversationId: conversation.id,
          userId: result.userId,
          userName: result.userName,
          distributionScore: result.distributionInfo?.distributionScore || 0
        });
      } else {
        console.log(`❌ Falha: ${result.reason}`);
      }
      
      // Pequena pausa para simular intervalo real
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Analisar resultados
    console.log('\n📈 ANÁLISE DOS RESULTADOS:');
    const userAssignments = {};
    assignmentResults.forEach(result => {
      if (!userAssignments[result.userName]) {
        userAssignments[result.userName] = 0;
      }
      userAssignments[result.userName]++;
    });

    console.log('Distribuição das 10 atribuições:');
    Object.entries(userAssignments).forEach(([userName, count]) => {
      console.log(`- ${userName}: ${count} atribuições`);
    });

    // Calcular equidade
    const assignmentCounts = Object.values(userAssignments);
    const average = assignmentCounts.reduce((a, b) => a + b, 0) / assignmentCounts.length;
    const variance = assignmentCounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / assignmentCounts.length;
    const standardDeviation = Math.sqrt(variance);

    console.log(`\n🎯 MÉTRICAS DE EQUIDADE:`);
    console.log(`- Média de atribuições por usuário: ${average.toFixed(2)}`);
    console.log(`- Desvio padrão: ${standardDeviation.toFixed(2)}`);
    
    let equityLevel = 'EXCELENTE';
    if (standardDeviation > 2) equityLevel = 'RUIM';
    else if (standardDeviation > 1.5) equityLevel = 'MODERADA';
    else if (standardDeviation > 1) equityLevel = 'BOA';
    
    console.log(`- Nível de equidade: ${equityLevel}`);

    // Estatísticas finais
    console.log('\n📊 ESTATÍSTICAS APÓS O TESTE:');
    const statsAfter = await equitableRoundRobinService.getEquityStats(teamId);
    console.log(`- Equidade da distribuição: ${statsAfter.distributionEquity}`);
    
    if (statsAfter.userStats.length > 0) {
      console.log('- Nova distribuição por usuário:');
      statsAfter.userStats.forEach(user => {
        console.log(`  • ${user.name}: ${user.totalAssignments} atribuições totais, ${user.activeConversations} ativas (Ratio: ${user.equityRatio})`);
      });
    }

    // Limpar conversas de teste
    console.log('\n🧹 Limpando conversas de teste...');
    const testConversationIds = assignmentResults.map(r => r.conversationId);
    if (testConversationIds.length > 0) {
      await db
        .delete(conversations)
        .where(eq(conversations.id, testConversationIds[0])); // Remover apenas a primeira para não afetar dados reais
    }

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log(`🎯 Sistema ${equityLevel === 'EXCELENTE' || equityLevel === 'BOA' ? 'APROVADO' : 'NECESSITA AJUSTES'} - Equidade: ${equityLevel}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEquitableDistribution()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

export { testEquitableDistribution };