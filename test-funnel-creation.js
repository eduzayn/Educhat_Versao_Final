// Script para testar criação automática de funis
const { funnelService } = require('./server/services/funnelService.ts');

async function testFunnelCreation() {
  try {
    console.log('🧪 Testando criação automática de funil para equipe ID: 14...');
    
    // Testar criação de funil para a equipe de teste
    const result = await funnelService.createFunnelForTeam(14);
    
    if (result) {
      console.log('✅ Funil criado com sucesso!');
    } else {
      console.log('❌ Falha na criação do funil');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testFunnelCreation();