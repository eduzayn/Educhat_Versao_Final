// Script para testar as variáveis de ambiente essenciais
console.log('Testando variáveis de ambiente essenciais...');

// Função para verificar se uma variável está definida
function checkEnvVariable(name) {
  const value = process.env[name];
  if (!value) {
    return `❌ ${name} não está definida`;
  }
  
  // Para variáveis sensíveis, apenas mostrar que existem, não o valor completo
  if (name.includes('SECRET') || name.includes('TOKEN') || name.includes('PASSWORD') || name.includes('KEY')) {
    return `✅ ${name} está definida (valor oculto por segurança)`;
  }
  
  // Para outras variáveis, mostrar o valor
  return `✅ ${name} = ${value}`;
}

// Lista de variáveis de ambiente essenciais
const essentialVariables = [
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET',
  'ZAPI_TOKEN',
  'ZAPI_INSTANCE_ID',
  'ZAPI_BASE_URL',
  'ZAPI_CLIENT_TOKEN'
];

// Verificar cada variável
console.log('\nResultados:');
essentialVariables.forEach(varName => {
  console.log(checkEnvVariable(varName));
});

// Verificar variáveis relacionadas ao banco de dados
const dbVariables = [
  'PGDATABASE',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD'
];

console.log('\nVariáveis de banco de dados (alternativas):');
dbVariables.forEach(varName => {
  console.log(checkEnvVariable(varName));
});

// Verificar variáveis específicas do Render
console.log('\nVariáveis específicas do Render:');
console.log(checkEnvVariable('PORT'));
console.log(checkEnvVariable('RENDER_EXTERNAL_URL'));

console.log('\nSe algumas variáveis essenciais estiverem faltando, configure-as no painel do Render.'); 