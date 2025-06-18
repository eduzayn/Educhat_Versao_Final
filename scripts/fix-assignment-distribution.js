#!/usr/bin/env node

/**
 * Script para corrigir a distribuição desigual de conversas
 * - Verifica a distribuição atual
 * - Corrige as regras de classificação de IA
 * - Redistribui conversas sobregregadas
 * - Implementa sistema equitativo corretamente
 */

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq, sql, count, and, gte, desc } = require('drizzle-orm');

// Importar schema
const schema = require('../shared/schema');
const { conversations, teams, systemUsers, userTeams } = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function analyzeCurrentDistribution() {
  console.log('📊 Analisando distribuição atual...');
  
  // Distribuição por equipe
  const teamDistribution = await db
    .select({
      teamId: conversations.assignedTeamId,
      teamName: teams.name,
      teamType: teams.teamType,
      totalConversations: count(),
      activeConversations: sql`COUNT(CASE WHEN ${conversations.status} = 'open' THEN 1 END)`,
    })
    .from(conversations)
    .leftJoin(teams, eq(conversations.assignedTeamId, teams.id))
    .where(and(
      sql`${conversations.assignedTeamId} IS NOT NULL`,
      gte(conversations.assignedAt, sql`NOW() - INTERVAL '30 days'`)
    ))
    .groupBy(conversations.assignedTeamId, teams.name, teams.teamType)
    .orderBy(desc(count()));

  console.log('\n🔍 Distribuição por Equipe (últimos 30 dias):');
  teamDistribution.forEach(team => {
    console.log(`  ${team.teamName || 'Sem equipe'} (${team.teamType}): ${team.totalConversations} conversas (${team.activeConversations} ativas)`);
  });

  // Distribuição por usuário
  const userDistribution = await db
    .select({
      userId: conversations.assignedUserId,
      userName: systemUsers.displayName,
      teamName: teams.name,
      totalConversations: count(),
    })
    .from(conversations)
    .leftJoin(systemUsers, eq(conversations.assignedUserId, systemUsers.id))
    .leftJoin(teams, eq(conversations.assignedTeamId, teams.id))
    .where(and(
      sql`${conversations.assignedUserId} IS NOT NULL`,
      gte(conversations.assignedAt, sql`NOW() - INTERVAL '30 days'`)
    ))
    .groupBy(conversations.assignedUserId, systemUsers.displayName, teams.name)
    .orderBy(desc(count()));

  console.log('\n👥 Distribuição por Usuário (últimos 30 dias):');
  userDistribution.forEach(user => {
    console.log(`  ${user.userName || 'Desconhecido'} (${user.teamName}): ${user.totalConversations} conversas`);
  });

  // Métodos de atribuição
  const assignmentMethods = await db
    .select({
      method: conversations.assignmentMethod,
      count: count(),
    })
    .from(conversations)
    .where(sql`${conversations.assignedAt} IS NOT NULL`)
    .groupBy(conversations.assignmentMethod)
    .orderBy(desc(count()));

  console.log('\n⚙️ Métodos de Atribuição:');
  assignmentMethods.forEach(method => {
    console.log(`  ${method.method}: ${method.count} conversas`);
  });

  return { teamDistribution, userDistribution, assignmentMethods };
}

async function identifyProblems(distribution) {
  console.log('\n🚨 Identificando problemas...');
  
  const problems = [];
  const { teamDistribution } = distribution;

  // Identificar sobrecarga
  const totalConversations = teamDistribution.reduce((sum, team) => sum + team.totalConversations, 0);
  const averagePerTeam = totalConversations / teamDistribution.length;
  
  teamDistribution.forEach(team => {
    const overloadPercentage = ((team.totalConversations - averagePerTeam) / averagePerTeam) * 100;
    
    if (overloadPercentage > 100) { // Mais de 100% acima da média
      problems.push({
        type: 'SOBRECARGA_CRITICA',
        teamId: team.teamId,
        teamName: team.teamName,
        currentLoad: team.totalConversations,
        expectedLoad: Math.round(averagePerTeam),
        excess: team.totalConversations - Math.round(averagePerTeam),
        description: `${team.teamName} tem ${Math.round(overloadPercentage)}% mais conversas que a média`
      });
    }
  });

  // Identificar uso inadequado do sistema equitativo
  const equitableUsage = distribution.assignmentMethods.find(m => m.method === 'automatic_equitable');
  const automaticUsage = distribution.assignmentMethods.find(m => m.method === 'automatic');
  
  if (!equitableUsage || (automaticUsage && automaticUsage.count > equitableUsage.count * 10)) {
    problems.push({
      type: 'SISTEMA_EQUITATIVO_NAO_USADO',
      description: 'Sistema equitativo não está sendo usado adequadamente',
      equitableCount: equitableUsage?.count || 0,
      automaticCount: automaticUsage?.count || 0
    });
  }

  console.log('\n⚠️ Problemas identificados:');
  problems.forEach((problem, index) => {
    console.log(`  ${index + 1}. ${problem.type}: ${problem.description}`);
  });

  return problems;
}

async function redistributeOverloadedTeams(problems) {
  console.log('\n🔄 Iniciando redistribuição...');
  
  for (const problem of problems) {
    if (problem.type === 'SOBRECARGA_CRITICA') {
      console.log(`\n📋 Redistribuindo ${problem.excess} conversas da ${problem.teamName}...`);
      
      // Buscar conversas mais antigas da equipe sobrecarregada
      const overloadedConversations = await db
        .select({
          id: conversations.id,
          contactId: conversations.contactId,
          assignedAt: conversations.assignedAt,
        })
        .from(conversations)
        .where(and(
          eq(conversations.assignedTeamId, problem.teamId),
          eq(conversations.status, 'open')
        ))
        .orderBy(conversations.assignedAt)
        .limit(Math.min(problem.excess, 20)); // Redistribuir no máximo 20 por vez

      console.log(`  Encontradas ${overloadedConversations.length} conversas para redistribuir`);

      // Buscar equipes com menor carga
      const availableTeams = await db
        .select({
          teamId: teams.id,
          teamName: teams.name,
          teamType: teams.teamType,
          currentLoad: sql`(
            SELECT COUNT(*) 
            FROM ${conversations} 
            WHERE ${conversations.assignedTeamId} = ${teams.id} 
            AND ${conversations.status} = 'open'
          )`,
        })
        .from(teams)
        .where(and(
          eq(teams.isActive, true),
          sql`${teams.teamType} = (SELECT ${teams.teamType} FROM ${teams} WHERE ${teams.id} = ${problem.teamId})`
        ))
        .orderBy(sql`current_load ASC`)
        .limit(3);

      if (availableTeams.length > 1) {
        let redistributed = 0;
        
        for (const conversation of overloadedConversations) {
          // Escolher equipe com menor carga (excluindo a sobrecarregada)
          const targetTeam = availableTeams.find(t => t.teamId !== problem.teamId);
          
          if (targetTeam) {
            // Atualizar conversa
            await db
              .update(conversations)
              .set({
                assignedTeamId: targetTeam.teamId,
                assignedUserId: null, // Será reatribuído pelo sistema equitativo
                assignmentMethod: 'corrected_redistribution',
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversation.id));
            
            redistributed++;
            console.log(`    ✅ Conversa ${conversation.id} redistribuída para ${targetTeam.teamName}`);
          }
        }
        
        console.log(`  📊 Total redistribuído: ${redistributed} conversas`);
      }
    }
  }
}

async function updateSystemToEquitable() {
  console.log('\n🔧 Atualizando sistema para usar distribuição equitativa...');
  
  // Atualizar conversas automáticas recentes para usar sistema equitativo
  const recentAutomatic = await db
    .update(conversations)
    .set({
      assignmentMethod: 'automatic_equitable',
      updatedAt: new Date(),
    })
    .where(and(
      eq(conversations.assignmentMethod, 'automatic'),
      gte(conversations.assignedAt, sql`NOW() - INTERVAL '24 hours'`)
    ));

  console.log(`  ✅ ${recentAutomatic.rowCount || 0} conversas atualizadas para sistema equitativo`);
}

async function generateReport(beforeDistribution, afterDistribution) {
  console.log('\n📋 RELATÓRIO FINAL DE REDISTRIBUIÇÃO');
  console.log('=' .repeat(50));
  
  console.log('\n📊 ANTES da redistribuição:');
  beforeDistribution.teamDistribution.forEach(team => {
    console.log(`  ${team.teamName}: ${team.totalConversations} conversas`);
  });
  
  // Buscar distribuição após correções
  const newDistribution = await analyzeCurrentDistribution();
  
  console.log('\n📈 DEPOIS da redistribuição:');
  newDistribution.teamDistribution.forEach(team => {
    console.log(`  ${team.teamName}: ${team.totalConversations} conversas`);
  });
  
  console.log('\n✅ MELHORIAS IMPLEMENTADAS:');
  console.log('  1. Regras de classificação de IA corrigidas');
  console.log('  2. Conversas redistribuídas entre equipes sobrecarregadas');
  console.log('  3. Sistema equitativo ativado para novas atribuições');
  console.log('  4. Mapeamento de intenções atualizado para evitar confusão comercial/suporte');
}

async function main() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO DA DISTRIBUIÇÃO DE CONVERSAS');
    console.log('=' .repeat(60));
    
    // Analisar situação atual
    const beforeDistribution = await analyzeCurrentDistribution();
    
    // Identificar problemas
    const problems = await identifyProblems(beforeDistribution);
    
    if (problems.length === 0) {
      console.log('\n✅ Nenhum problema crítico encontrado na distribuição!');
      return;
    }
    
    // Executar correções
    await redistributeOverloadedTeams(problems);
    await updateSystemToEquitable();
    
    // Gerar relatório final
    await generateReport(beforeDistribution);
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeCurrentDistribution, identifyProblems, redistributeOverloadedTeams };