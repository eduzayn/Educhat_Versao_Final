#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

const routesToTest = [
  // Rotas públicas
  { method: 'GET', path: '/api/health', description: 'Health check' },
  { method: 'GET', path: '/api/zapi/status', description: 'Z-API status' },
  
  // Rotas de autenticação (sem auth)
  { method: 'GET', path: '/api/user', description: 'Get current user', expectAuth: true },
  
  // Rotas principais da aplicação
  { method: 'GET', path: '/api/contacts', description: 'Get contacts', expectAuth: true },
  { method: 'GET', path: '/api/conversations', description: 'Get conversations', expectAuth: true },
  { method: 'GET', path: '/api/conversations/unread-count', description: 'Unread count', expectAuth: true },
  { method: 'GET', path: '/api/channels', description: 'Get channels', expectAuth: true },
  { method: 'GET', path: '/api/teams', description: 'Get teams', expectAuth: true },
  { method: 'GET', path: '/api/quick-replies', description: 'Get quick replies', expectAuth: true },
  { method: 'GET', path: '/api/deals', description: 'Get deals', expectAuth: true },
  
  // Rotas Z-API (módulo consolidado)
  { method: 'GET', path: '/api/zapi/status', description: 'Z-API status check' },
  
  // Rotas administrativas
  { method: 'GET', path: '/api/admin/users', description: 'Admin users', expectAuth: true, expectAdmin: true },
  { method: 'GET', path: '/api/admin/roles', description: 'Admin roles', expectAuth: true, expectAdmin: true },
];

async function testRoute(route) {
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    let result = 'PASS';
    let note = '';

    if (route.expectAuth && status === 401) {
      result = 'EXPECTED';
      note = 'Requires authentication';
    } else if (route.expectAdmin && status === 403) {
      result = 'EXPECTED';
      note = 'Requires admin role';
    } else if (status >= 200 && status < 300) {
      result = 'PASS';
      note = 'Success';
    } else if (status >= 400 && status < 500) {
      result = 'WARN';
      note = `Client error: ${status}`;
    } else if (status >= 500) {
      result = 'FAIL';
      note = `Server error: ${status}`;
    }

    return {
      route: route.path,
      method: route.method,
      status,
      result,
      note,
      description: route.description
    };
  } catch (error) {
    return {
      route: route.path,
      method: route.method,
      status: 'ERROR',
      result: 'FAIL',
      note: error.message,
      description: route.description
    };
  }
}

async function runTests() {
  console.log('🔍 Testando rotas da API...\n');
  
  const results = [];
  
  for (const route of routesToTest) {
    const result = await testRoute(route);
    results.push(result);
    
    const statusColor = result.result === 'PASS' ? '✅' : 
                       result.result === 'EXPECTED' ? '⚠️' : 
                       result.result === 'WARN' ? '🟡' : '❌';
    
    console.log(`${statusColor} ${result.method} ${result.route} - ${result.note}`);
  }
  
  console.log('\n📊 Resumo dos Testes:');
  const summary = results.reduce((acc, result) => {
    acc[result.result] = (acc[result.result] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(summary).forEach(([status, count]) => {
    console.log(`${status}: ${count} rotas`);
  });
  
  console.log(`\nTotal: ${results.length} rotas testadas`);
}

// Executar se for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testRoute };