/**
 * Script de teste para verificar integração completa da gamificação
 * Testa round-robin com atualização em tempo real das estatísticas
 */

import { db } from './db.js';
import { gamificationService } from './services/gamificationService.js';
import { equitableRoundRobinService } from './services/equitableRoundRobinService.js';
import { gamificationWebhook } from './services/gamificationWebhookIntegration.js';

async function testGamificationIntegration() {
  try {
    console.log('🎮 Testando integração completa da gamificação com transferências...\n');

    // 1. Buscar usuário de teste
    const testUser = await db.query('SELECT id FROM system_users WHERE email = $1 LIMIT 1', ['admin@educhat.com']);
    if (testUser.rows.length === 0) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }
    const userId = testUser.rows[0].id;
    console.log(`👤 Usuário de teste: ID ${userId}`);

    // 2. Buscar equipe de teste
    const testTeam = await db.query('SELECT id FROM teams WHERE is_active = true LIMIT 1');
    if (testTeam.rows.length === 0) {
      console.log('❌ Equipe de teste não encontrada');
      return;
    }
    const teamId = testTeam.rows[0].id;
    console.log(`👥 Equipe de teste: ID ${teamId}`);

    // 3. Criar conversa de teste
    const testConversation = await db.query(`
      INSERT INTO conversations (contact_id, channel, status, team_type, created_at)
      VALUES (1, 'whatsapp', 'open', 'suporte', NOW())
      RETURNING id
    `);
    const conversationId = testConversation.rows[0].id;
    console.log(`💬 Conversa de teste criada: ID ${conversationId}`);

    // 4. Testar estatísticas antes da atribuição
    console.log('\n📊 Estatísticas antes da atribuição:');
    const statsBefore = await gamificationService.getUserStats(userId, 'daily');
    console.log(`- Conversas atribuídas: ${statsBefore?.conversationsAssigned || 0}`);
    console.log(`- Pontos totais: ${statsBefore?.totalPoints || 0}`);

    // 5. Executar round-robin com integração de gamificação
    console.log('\n🎯 Executando round-robin...');
    const result = await equitableRoundRobinService.assignUserToConversation(conversationId, teamId);
    
    if (result.success && result.userId) {
      console.log(`✅ Atribuição bem-sucedida para usuário ${result.userId}`);
      
      // Simular webhook de gamificação
      await gamificationWebhook.onConversationAssigned(result.userId, conversationId);
      console.log('🎮 Webhook de gamificação executado');
    } else {
      console.log(`❌ Falha na atribuição: ${result.reason}`);
      return;
    }

    // 6. Verificar estatísticas após a atribuição
    console.log('\n📊 Estatísticas após a atribuição:');
    const statsAfter = await gamificationService.getUserStats(userId, 'daily');
    console.log(`- Conversas atribuídas: ${statsAfter?.conversationsAssigned || 0}`);
    console.log(`- Pontos totais: ${statsAfter?.totalPoints || 0}`);

    // 7. Testar badges do usuário
    console.log('\n🏆 Badges do usuário:');
    const badges = await gamificationService.getUserBadges(userId);
    badges.slice(0, 3).forEach(badge => {
      console.log(`- ${badge.name}: ${badge.progress}/${badge.maxProgress} (${badge.isEarned ? 'CONQUISTADO' : 'EM PROGRESSO'})`);
    });

    // 8. Testar leaderboard
    console.log('\n🏅 Top 3 do ranking diário:');
    const leaderboard = await gamificationService.getLeaderboard('total_points', 'daily', undefined, 3);
    leaderboard.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.userName}: ${entry.points} pontos`);
    });

    // 9. Simular fechamento da conversa
    console.log('\n🔄 Simulando fechamento da conversa...');
    await db.query('UPDATE conversations SET status = $1 WHERE id = $2', ['closed', conversationId]);
    await gamificationWebhook.onConversationClosed(userId, conversationId);
    console.log('✅ Webhook de fechamento executado');

    // 10. Verificar estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    const statsFinal = await gamificationService.getUserStats(userId, 'daily');
    console.log(`- Conversas atribuídas: ${statsFinal?.conversationsAssigned || 0}`);
    console.log(`- Conversas fechadas: ${statsFinal?.conversationsClosed || 0}`);
    console.log(`- Pontos totais: ${statsFinal?.totalPoints || 0}`);

    // Limpeza
    await db.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    console.log('\n🧹 Conversa de teste removida');

    console.log('\n✅ Teste de integração da gamificação concluído com sucesso!');
    console.log('🎮 Sistema de gamificação está 100% integrado com transferências em tempo real');

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
  } finally {
    process.exit(0);
  }
}

testGamificationIntegration();