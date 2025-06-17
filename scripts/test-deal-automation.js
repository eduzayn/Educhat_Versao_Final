/**
 * Script para testar a criação automática de negócios
 * Verifica se o sistema está criando deals corretamente quando conversas são atribuídas a equipes
 */

import pkg from 'pg';
const { Pool } = pkg;

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDealAutomation() {
  try {
    console.log('🧪 TESTANDO SISTEMA DE CRIAÇÃO AUTOMÁTICA DE NEGÓCIOS');
    console.log('=' .repeat(60));
    
    // 1. Verificar equipes existentes
    console.log('\n🏢 EQUIPES CONFIGURADAS:');
    const teamsResult = await pool.query(`
      SELECT id, name, team_type, is_active, max_capacity 
      FROM teams 
      WHERE is_active = true 
      ORDER BY team_type
    `);
    
    if (teamsResult.rows.length === 0) {
      console.log('❌ Nenhuma equipe ativa encontrada');
      return;
    }
    
    teamsResult.rows.forEach(team => {
      console.log(`  ✓ ${team.name} (${team.team_type}) - Capacidade: ${team.max_capacity || 'Ilimitada'}`);
    });
    
    // 2. Verificar funis existentes
    console.log('\n🔄 FUNIS CONFIGURADOS:');
    const funnelsResult = await pool.query(`
      SELECT id, name, team_type, is_active, stages 
      FROM funnels 
      WHERE is_active = true 
      ORDER BY team_type
    `);
    
    if (funnelsResult.rows.length === 0) {
      console.log('❌ Nenhum funil ativo encontrado');
      return;
    }
    
    funnelsResult.rows.forEach(funnel => {
      const stageCount = Array.isArray(funnel.stages) ? funnel.stages.length : 0;
      console.log(`  ✓ ${funnel.name} (${funnel.team_type}) - ${stageCount} estágios`);
    });
    
    // 3. Verificar conversas recentes sem deals associados
    console.log('\n💬 CONVERSAS RECENTES SEM DEALS:');
    const conversationsResult = await pool.query(`
      SELECT c.id, c.contact_id, c.team_type, c.channel, c.created_at,
             ct.name as contact_name, ct.phone,
             COUNT(d.id) as deal_count
      FROM conversations c
      LEFT JOIN contacts ct ON ct.id = c.contact_id
      LEFT JOIN deals d ON d.contact_id = c.contact_id AND d.stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')
      WHERE c.created_at >= NOW() - INTERVAL '24 hours'
      AND c.team_type IS NOT NULL
      GROUP BY c.id, c.contact_id, c.team_type, c.channel, c.created_at, ct.name, ct.phone
      HAVING COUNT(d.id) = 0
      ORDER BY c.created_at DESC
      LIMIT 10
    `);
    
    if (conversationsResult.rows.length === 0) {
      console.log('  ✓ Todas as conversas recentes com equipe têm deals associados');
    } else {
      console.log(`  ⚠️  ${conversationsResult.rows.length} conversas sem deals automáticos:`);
      conversationsResult.rows.forEach(conv => {
        console.log(`    - Conversa ${conv.id}: ${conv.contact_name} (${conv.team_type}) - ${conv.channel}`);
      });
    }
    
    // 4. Verificar deals criados nas últimas 24h
    console.log('\n📈 DEALS CRIADOS RECENTEMENTE:');
    const recentDealsResult = await pool.query(`
      SELECT d.id, d.name, d.team_type, d.stage, d.channel_origem as canal_origem,
             d.created_at, ct.name as contact_name
      FROM deals d
      LEFT JOIN contacts ct ON ct.id = d.contact_id
      WHERE d.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY d.created_at DESC
      LIMIT 15
    `);
    
    if (recentDealsResult.rows.length === 0) {
      console.log('  📊 Nenhum deal criado nas últimas 24 horas');
    } else {
      console.log(`  📊 ${recentDealsResult.rows.length} deals criados:`);
      recentDealsResult.rows.forEach(deal => {
        const timeAgo = new Date(Date.now() - new Date(deal.created_at).getTime());
        const hoursAgo = Math.floor(timeAgo.getTime() / (1000 * 60 * 60));
        console.log(`    ✓ "${deal.name}" - ${deal.contact_name} (${deal.team_type}) - ${hoursAgo}h atrás`);
      });
    }
    
    // 5. Testar criação manual de deal automático
    console.log('\n🔬 TESTE DE CRIAÇÃO AUTOMÁTICA:');
    
    // Buscar uma conversa recente para teste
    const testConvResult = await pool.query(`
      SELECT c.id, c.contact_id, c.team_type, ct.name as contact_name
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      WHERE c.team_type IS NOT NULL
      AND c.created_at >= NOW() - INTERVAL '1 day'
      LIMIT 1
    `);
    
    if (testConvResult.rows.length > 0) {
      const testConv = testConvResult.rows[0];
      console.log(`  🎯 Testando com conversa ${testConv.id} - ${testConv.contact_name} (${testConv.team_type})`);
      
      // Verificar se já existe deal ativo para este contato
      const existingDealResult = await pool.query(`
        SELECT id, name, stage FROM deals 
        WHERE contact_id = $1 
        AND stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')
        LIMIT 1
      `, [testConv.contact_id]);
      
      if (existingDealResult.rows.length > 0) {
        console.log(`  ✓ Deal ativo já existe: "${existingDealResult.rows[0].name}" (${existingDealResult.rows[0].stage})`);
      } else {
        console.log(`  ⚠️  Nenhum deal ativo encontrado para contato ${testConv.contact_id}`);
        console.log(`  💡 Sistema deveria ter criado deal automático para equipe "${testConv.team_type}"`);
      }
    } else {
      console.log('  📋 Nenhuma conversa recente com equipe definida para teste');
    }
    
    // 6. Estatísticas gerais
    console.log('\n📊 ESTATÍSTICAS GERAIS:');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT CASE WHEN c.team_type IS NOT NULL THEN c.id END) as conversations_with_team,
        COUNT(DISTINCT d.id) as active_deals,
        COUNT(DISTINCT CASE WHEN d.created_at >= NOW() - INTERVAL '7 days' THEN d.id END) as deals_last_week
      FROM conversations c
      LEFT JOIN deals d ON d.contact_id = c.contact_id 
        AND d.stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  • Total de conversas: ${stats.total_conversations}`);
    console.log(`  • Conversas com equipe atribuída: ${stats.conversations_with_team}`);
    console.log(`  • Deals ativos: ${stats.active_deals}`);
    console.log(`  • Deals criados na última semana: ${stats.deals_last_week}`);
    
    // Calcular taxa de conversão
    const conversionRate = stats.conversations_with_team > 0 
      ? ((stats.active_deals / stats.conversations_with_team) * 100).toFixed(1)
      : 0;
    console.log(`  • Taxa de conversão conversa→deal: ${conversionRate}%`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE DE AUTOMAÇÃO CONCLUÍDO');
    
    // Recomendações
    if (conversationsResult.rows.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      console.log('  • Verificar se o webhook está chamando a criação automática de deals');
      console.log('  • Conferir se as equipes têm funis configurados corretamente');
      console.log('  • Validar se a lógica de handoff inteligente está funcionando');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de automação:', error);
  } finally {
    await pool.end();
  }
}

// Executar teste
testDealAutomation().catch(console.error);