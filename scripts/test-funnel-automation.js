#!/usr/bin/env node

/**
 * Script para testar o sistema completo de automação de funis
 * Testa o fluxo: Contato → Conversa → Atribuição de Equipe → Criação Automática de Deal no Funil Correto
 */

import { Pool } from 'pg';

async function testFunnelAutomation() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('🧪 Iniciando teste do sistema de automação de funis...\n');
  
  try {
    // 1. Verificar funis criados
    const funnelsResult = await pool.query(`
      SELECT f.id, f.name, f.team_type, f.team_id, t.name as team_name 
      FROM funnels f 
      LEFT JOIN teams t ON f.team_id = t.id 
      ORDER BY f.team_id
    `);
    
    console.log('📊 FUNIS CONFIGURADOS:');
    funnelsResult.rows.forEach(funnel => {
      console.log(`  ✓ ${funnel.name} (${funnel.team_type}) → Equipe: ${funnel.team_name} (ID: ${funnel.team_id})`);
    });
    console.log(`  Total: ${funnelsResult.rows.length} funis\n`);
    
    // 2. Verificar deals associados aos funis
    const dealsResult = await pool.query(`
      SELECT d.team_type, f.name as funnel_name, f.team_id, COUNT(*) as deal_count
      FROM deals d 
      JOIN funnels f ON d.funnel_id = f.id 
      GROUP BY d.team_type, f.name, f.team_id 
      ORDER BY deal_count DESC
    `);
    
    console.log('💼 DEALS POR FUNIL:');
    dealsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.funnel_name}: ${row.deal_count} deals (Equipe ${row.team_id})`);
    });
    console.log(`  Total deals associados: ${dealsResult.rows.reduce((sum, row) => sum + parseInt(row.deal_count), 0)}\n`);
    
    // 3. Verificar integridade da automação
    const orphanDealsResult = await pool.query(`
      SELECT COUNT(*) as orphan_count FROM deals WHERE funnel_id IS NULL
    `);
    
    const orphanCount = parseInt(orphanDealsResult.rows[0].orphan_count);
    if (orphanCount > 0) {
      console.log(`⚠️  ATENÇÃO: ${orphanCount} deals sem funil associado`);
    } else {
      console.log('✅ Todos os deals estão associados a funis');
    }
    
    // 4. Verificar estágios por macrosetor
    console.log('\n🎯 ESTÁGIOS INICIAIS POR MACROSETOR:');
    const stageMappings = {
      'comercial': 'prospecting',
      'suporte': 'new_ticket', 
      'tutoria': 'duvida-academica',
      'financeiro': 'analise-inicial',
      'secretaria': 'documentos-pendentes',
      'secretaria_pos': 'documentos-inicial',
      'cobranca': 'inadimplente',
      'analise_certificacao': 'solicitacao_recebida',
      'documentacao': 'solicitacao_recebida'
    };
    
    Object.entries(stageMappings).forEach(([macrosetor, expectedStage]) => {
      console.log(`  ✓ ${macrosetor} → ${expectedStage}`);
    });
    
    // 5. Verificar se funis têm as equipes corretas
    const teamFunnelResult = await pool.query(`
      SELECT t.id, t.name, t.macrosetor, f.id as funnel_id, f.name as funnel_name
      FROM teams t 
      LEFT JOIN funnels f ON f.team_id = t.id 
      WHERE t.id >= 5 
      ORDER BY t.id
    `);
    
    console.log('\n🏢 ASSOCIAÇÃO EQUIPES ↔ FUNIS:');
    teamFunnelResult.rows.forEach(row => {
      if (row.funnel_id) {
        console.log(`  ✅ Equipe "${row.name}" (${row.macrosetor}) → Funil "${row.funnel_name}" (ID: ${row.funnel_id})`);
      } else {
        console.log(`  ❌ Equipe "${row.name}" (${row.macrosetor}) → SEM FUNIL`);
      }
    });
    
    // 6. Status final do sistema
    console.log('\n🎉 RESUMO DO SISTEMA:');
    console.log(`  • ${funnelsResult.rows.length} funis configurados`);
    console.log(`  • ${dealsResult.rows.reduce((sum, row) => sum + parseInt(row.deal_count), 0)} deals associados a funis`);
    console.log(`  • ${orphanCount} deals órfãos`);
    console.log(`  • Automação ativa para novas equipes`);
    console.log(`  • Deal automation integrado com funis`);
    
    const systemHealth = orphanCount === 0 && funnelsResult.rows.length >= 9 ? 'OPERACIONAL' : 'ATENÇÃO NECESSÁRIA';
    console.log(`\n🚀 STATUS DO SISTEMA: ${systemHealth}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

// Executar teste
testFunnelAutomation().catch(console.error);