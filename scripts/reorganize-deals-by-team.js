/**
 * Script para reorganizar negócios existentes para os funis corretos
 * Move negócios que têm equipes definidas para o primeiro estágio do funil correspondente
 */

import pkg from 'pg';
const { Pool } = pkg;

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Mapeamento de equipes para o primeiro estágio do funil correspondente
const teamToFirstStage = {
  'comercial': 'prospecting',
  'suporte': 'solicitacao',
  'financeiro': 'solicitacao_recebida',
  'secretaria': 'documentos-pendentes',
  'tutoria': 'nova_solicitacao',
  'cobranca': 'inadimplente',
  'secretaria_pos': 'documentos-pendentes',
  'analise_certificacao': 'solicitacao_recebida',
  'documentacao': 'solicitacao_recebida',
  'geral': 'prospecting',
  'teste_automacao': 'initial'
};

async function reorganizeDeals() {
  try {
    console.log('🔄 Iniciando reorganização de negócios por equipe...');
    
    // Buscar todos os negócios que têm equipes definidas
    const dealsQuery = `
      SELECT id, name, macrosetor, stage, contact_id
      FROM deals 
      WHERE macrosetor IS NOT NULL AND macrosetor != ''
      ORDER BY macrosetor, id
    `;
    
    const dealsResult = await pool.query(dealsQuery);
    const deals = dealsResult.rows;
    
    console.log(`📊 Encontrados ${deals.length} negócios com equipes definidas`);
    
    // Agrupar por equipe
    const dealsByTeam = {};
    deals.forEach(deal => {
      if (!dealsByTeam[deal.macrosetor]) {
        dealsByTeam[deal.macrosetor] = [];
      }
      dealsByTeam[deal.macrosetor].push(deal);
    });
    
    console.log('📋 Negócios por equipe:');
    Object.keys(dealsByTeam).forEach(team => {
      console.log(`  - ${team}: ${dealsByTeam[team].length} negócios`);
    });
    
    let totalUpdated = 0;
    
    // Para cada equipe, mover negócios para o primeiro estágio do funil correto
    for (const [team, teamDeals] of Object.entries(dealsByTeam)) {
      const firstStage = teamToFirstStage[team];
      
      if (!firstStage) {
        console.log(`⚠️  Equipe '${team}' não tem mapeamento de estágio definido`);
        continue;
      }
      
      console.log(`\n🔄 Processando equipe '${team}' - movendo para estágio '${firstStage}'`);
      
      // Contar quantos já estão no estágio correto
      const alreadyCorrect = teamDeals.filter(deal => deal.stage === firstStage).length;
      const needsUpdate = teamDeals.filter(deal => deal.stage !== firstStage);
      
      console.log(`  - ${alreadyCorrect} já estão no estágio correto`);
      console.log(`  - ${needsUpdate.length} precisam ser movidos`);
      
      if (needsUpdate.length > 0) {
        // Atualizar em lote
        const dealIds = needsUpdate.map(deal => deal.id);
        const updateQuery = `
          UPDATE deals 
          SET stage = $1, updated_at = NOW()
          WHERE id = ANY($2::int[])
        `;
        
        const updateResult = await pool.query(updateQuery, [firstStage, dealIds]);
        totalUpdated += updateResult.rowCount;
        
        console.log(`  ✅ ${updateResult.rowCount} negócios movidos para '${firstStage}'`);
        
        // Mostrar alguns exemplos
        needsUpdate.slice(0, 3).forEach(deal => {
          console.log(`    - "${deal.name}" (ID: ${deal.id}): '${deal.stage}' → '${firstStage}'`);
        });
        
        if (needsUpdate.length > 3) {
          console.log(`    ... e mais ${needsUpdate.length - 3} negócios`);
        }
      }
    }
    
    console.log(`\n✅ Reorganização concluída!`);
    console.log(`📊 Total de negócios atualizados: ${totalUpdated}`);
    
    // Verificar o resultado final
    console.log('\n📈 Verificação final - negócios por equipe e estágio:');
    const finalCheckQuery = `
      SELECT 
        macrosetor,
        stage,
        COUNT(*) as count
      FROM deals 
      WHERE macrosetor IS NOT NULL AND macrosetor != ''
      GROUP BY macrosetor, stage
      ORDER BY macrosetor, stage
    `;
    
    const finalResult = await pool.query(finalCheckQuery);
    const grouped = {};
    
    finalResult.rows.forEach(row => {
      if (!grouped[row.macrosetor]) {
        grouped[row.macrosetor] = {};
      }
      grouped[row.macrosetor][row.stage] = row.count;
    });
    
    Object.keys(grouped).forEach(team => {
      console.log(`\n  ${team}:`);
      Object.keys(grouped[team]).forEach(stage => {
        const isFirstStage = stage === teamToFirstStage[team];
        const marker = isFirstStage ? '🎯' : '  ';
        console.log(`    ${marker} ${stage}: ${grouped[team][stage]} negócios`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro durante reorganização:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
reorganizeDeals()
  .then(() => {
    console.log('\n🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na execução:', error.message);
    process.exit(1);
  });

export { reorganizeDeals };