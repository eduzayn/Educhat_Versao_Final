#!/usr/bin/env node

/**
 * Script para limpar deals duplicados
 * Executa a limpeza de negócios duplicados no sistema
 */

const { execSync } = require('child_process');

async function cleanupDuplicateDeals() {
  try {
    console.log('🧹 Iniciando limpeza de deals duplicados...');
    
    // Fazer requisição para a API de limpeza
    const response = await fetch('http://localhost:5000/api/admin/cleanup-duplicate-deals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Cookie de sessão do admin (seria necessário obter dinamicamente)
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Limpeza concluída:', result.message);
      console.log('📊 Detalhes:', result.details);
    } else {
      console.error('❌ Erro na limpeza:', await response.text());
    }
  } catch (error) {
    console.error('❌ Erro ao executar limpeza:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupDuplicateDeals();
}

module.exports = { cleanupDuplicateDeals };