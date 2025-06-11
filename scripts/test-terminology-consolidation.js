#!/usr/bin/env node

/**
 * Script para testar a consolidação da terminologia "macrosetor" → "equipes"
 * Verifica se a unificação foi implementada corretamente em todo o sistema
 */

import { db } from '../server/db.js';
import { teamConfigs, getStagesForTeam, getTeamInfo, getAllTeams } from '../client/src/lib/crmFunnels.js';

console.log('🔍 Testando consolidação da terminologia...\n');

async function testTerminologyConsolidation() {
  try {
    // Test 1: Verificar configurações centralizadas
    console.log('1. Testando configurações de equipes centralizadas...');
    const teams = getAllTeams();
    console.log(`   ✅ ${teams.length} equipes configuradas`);
    
    // Verificar se todas as equipes têm configuração válida
    for (const { id, info } of teams) {
      const stages = getStagesForTeam(id);
      console.log(`   ✅ Equipe "${info.name}": ${stages.length} estágios`);
    }

    // Test 2: Verificar se funis estão corretos para cada equipe
    console.log('\n2. Testando funis por equipe...');
    
    const expectedTeams = ['comercial', 'suporte', 'cobranca', 'secretaria', 'tutoria', 'financeiro', 'secretaria_pos'];
    let foundTeams = 0;
    
    for (const teamType of expectedTeams) {
      const teamInfo = getTeamInfo(teamType);
      if (teamInfo) {
        foundTeams++;
        console.log(`   ✅ ${teamType}: ${teamInfo.name}`);
      } else {
        console.log(`   ❌ ${teamType}: configuração não encontrada`);
      }
    }

    // Test 3: Verificar problema original - 2 equipes com mesmo funil
    console.log('\n3. Verificando resolução do problema de duplicação...');
    
    // Verificar se análise e documentação ainda compartilham o mesmo macrosetor
    const query = `
      SELECT DISTINCT macrosetor, COUNT(*) as team_count 
      FROM teams 
      WHERE macrosetor IS NOT NULL 
      GROUP BY macrosetor 
      HAVING COUNT(*) > 1
    `;
    
    const duplicateResults = await db.execute(query);
    
    if (duplicateResults.length === 0) {
      console.log('   ✅ Não há mais equipes compartilhando o mesmo macrosetor');
    } else {
      console.log('   ⚠️  Ainda existem equipes compartilhando macrosetores:');
      duplicateResults.forEach(row => {
        console.log(`      - ${row.macrosetor}: ${row.team_count} equipes`);
      });
    }

    // Test 4: Verificar integridade dos dados de negócios
    console.log('\n4. Verificando integridade dos negócios no CRM...');
    
    const dealsQuery = `
      SELECT macrosetor, COUNT(*) as deal_count 
      FROM deals 
      WHERE macrosetor IS NOT NULL 
      GROUP BY macrosetor 
      ORDER BY deal_count DESC
    `;
    
    const dealsResults = await db.execute(dealsQuery);
    
    if (dealsResults.length > 0) {
      console.log('   ✅ Distribuição de negócios por macrosetor:');
      dealsResults.forEach(row => {
        const teamInfo = getTeamInfo(row.macrosetor);
        const teamName = teamInfo ? teamInfo.name : 'Equipe não configurada';
        console.log(`      - ${row.macrosetor} (${teamName}): ${row.deal_count} negócios`);
      });
    } else {
      console.log('   ℹ️  Nenhum negócio encontrado no sistema');
    }

    // Test 5: Verificar se todas as equipes têm funis únicos
    console.log('\n5. Verificando unicidade dos funis...');
    
    const teamTypes = Object.keys(teamConfigs);
    const uniqueFunnels = new Set();
    let duplicateFunnels = [];
    
    teamTypes.forEach(teamType => {
      const stages = getStagesForTeam(teamType);
      const funnelSignature = stages.map(s => s.id).sort().join(',');
      
      if (uniqueFunnels.has(funnelSignature)) {
        duplicateFunnels.push(teamType);
      } else {
        uniqueFunnels.add(funnelSignature);
      }
    });
    
    if (duplicateFunnels.length === 0) {
      console.log('   ✅ Todos os funis são únicos');
    } else {
      console.log('   ⚠️  Funis duplicados encontrados:', duplicateFunnels);
    }

    // Summary
    console.log('\n📊 RESUMO DA CONSOLIDAÇÃO:');
    console.log(`   • ${foundTeams}/${expectedTeams.length} equipes configuradas corretamente`);
    console.log(`   • ${uniqueFunnels.size} funis únicos definidos`);
    console.log(`   • ${duplicateResults.length} conflitos de macrosetor restantes`);
    
    if (foundTeams === expectedTeams.length && duplicateResults.length === 0) {
      console.log('\n✅ CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('   A terminologia foi unificada e não há mais redundâncias.');
    } else {
      console.log('\n⚠️  CONSOLIDAÇÃO PARCIAL');
      console.log('   Ainda existem itens que precisam de atenção.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar teste
testTerminologyConsolidation()
  .then(() => {
    console.log('\n🏁 Teste de consolidação finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Falha crítica:', error);
    process.exit(1);
  });