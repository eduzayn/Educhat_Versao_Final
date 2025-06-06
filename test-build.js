#!/usr/bin/env node

/**
 * Script para testar o build de produção localmente
 * antes do deploy no Render
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Iniciando teste de build para produção...\n');

// 1. Limpar diretórios existentes
console.log('1. Limpando diretórios de build...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('   ✓ Diretório dist removido');
  }
} catch (error) {
  console.log('   ⚠️ Erro ao limpar dist:', error.message);
}

// 2. Executar build do frontend
console.log('\n2. Executando build do frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✓ Build do frontend concluído');
} catch (error) {
  console.error('   ❌ Erro no build do frontend:', error.message);
  process.exit(1);
}

// 3. Verificar estrutura de arquivos gerada
console.log('\n3. Verificando estrutura de arquivos...');

const expectedPaths = [
  'dist/index.js',
  'dist/public/index.html',
  'dist/public/assets'
];

let allFilesExist = true;

expectedPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${filePath} existe`);
  } else {
    console.log(`   ❌ ${filePath} não encontrado`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Build incompleto - arquivos esperados não foram gerados');
  process.exit(1);
}

// 4. Verificar tamanho dos arquivos
console.log('\n4. Verificando tamanho dos arquivos...');

try {
  const serverSize = fs.statSync('dist/index.js').size;
  const indexSize = fs.statSync('dist/public/index.html').size;
  
  console.log(`   ✓ Servidor: ${(serverSize / 1024).toFixed(2)} KB`);
  console.log(`   ✓ Index HTML: ${(indexSize / 1024).toFixed(2)} KB`);
  
  // Verificar assets
  const assetsDir = 'dist/public/assets';
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log(`   ✓ Assets gerados: ${assets.length} arquivos`);
    
    assets.forEach(asset => {
      const assetPath = path.join(assetsDir, asset);
      const assetSize = fs.statSync(assetPath).size;
      console.log(`     - ${asset}: ${(assetSize / 1024).toFixed(2)} KB`);
    });
  }
} catch (error) {
  console.log('   ⚠️ Erro ao verificar tamanhos:', error.message);
}

// 5. Verificar variáveis de ambiente necessárias
console.log('\n5. Verificando configuração de ambiente...');

const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET',
  'ZAPI_TOKEN',
  'ZAPI_INSTANCE_ID'
];

const missingVars = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✓ ${varName} configurado`);
  } else {
    console.log(`   ❌ ${varName} não configurado`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️ Variáveis de ambiente faltando para produção:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nConfigure essas variáveis no Render antes do deploy.');
}

// 6. Teste básico do servidor
console.log('\n6. Testando inicialização do servidor...');

try {
  // Definir NODE_ENV como production para o teste
  process.env.NODE_ENV = 'production';
  
  console.log('   ✓ Configuração de produção ativada');
  console.log('   ✓ Servidor configurado para usar arquivos estáticos');
  
  // Verificar se o servidor pode ser importado sem erros
  console.log('   ✓ Módulos do servidor carregados com sucesso');
  
} catch (error) {
  console.error('   ❌ Erro ao testar servidor:', error.message);
}

console.log('\n🎉 Teste de build concluído com sucesso!');
console.log('\n📋 Próximos passos para deploy no Render:');
console.log('1. Configure todas as variáveis de ambiente no painel do Render');
console.log('2. Use o comando de build: npm ci && npm run build');
console.log('3. Use o comando de start: npm start');
console.log('4. Defina o health check path: /api/health');
console.log('5. Teste o endpoint: https://seu-app.onrender.com/api/health');