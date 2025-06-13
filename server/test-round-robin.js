// Teste para verificar distribuição em rodízio fora do horário comercial
const { IntelligentHandoffService } = require('./services/intelligentHandoffService');

async function testRoundRobinDistribution() {
  console.log('🧪 Testando distribuição em rodízio fora do horário comercial...');
  
  const handoffService = new IntelligentHandoffService();
  
  // Simular situação fora do horário comercial
  const originalIsBusinessHours = handoffService.isBusinessHours;
  handoffService.isBusinessHours = () => false; // Forçar fora do horário
  
  try {
    // Buscar equipe da Prof Ana (ID 9 - Prof Ana)
    const profAnaTeamId = 9;
    
    console.log('🔍 Buscando usuários da equipe Prof Ana...');
    const recommendation = await handoffService.recommendHandoff(1561, 'overflow');
    
    console.log('📊 Recomendação gerada:', {
      teamId: recommendation.teamId,
      teamName: recommendation.teamName,
      userId: recommendation.userId,
      username: recommendation.username,
      reason: recommendation.reason
    });
    
    if (recommendation.teamId === profAnaTeamId) {
      console.log('✅ Sistema está funcionando: Prof Ana recebeu a recomendação');
      console.log('🎯 Distribuição em rodízio ativa para horário não comercial');
    } else {
      console.log('⚠️ Recomendação foi para outra equipe:', recommendation.teamName);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    // Restaurar função original
    handoffService.isBusinessHours = originalIsBusinessHours;
  }
}

// Executar teste
testRoundRobinDistribution();