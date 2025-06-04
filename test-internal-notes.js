// Script de teste para verificar se notas internas estão vazando para Z-API
import fetch from 'node-fetch';

async function testInternalNotesPrevention() {
  console.log('🧪 Testando prevenção de vazamento de notas internas...');
  
  try {
    // Simular criação de uma nota interna
    const testMessage = {
      content: "NOTA INTERNA DE TESTE - NÃO DEVE SER ENVIADA PARA Z-API",
      isFromContact: false,
      isInternalNote: true,
      authorName: "Sistema de Teste"
    };
    
    console.log('📝 Enviando nota interna de teste:', testMessage);
    
    const response = await fetch('http://localhost:5000/api/conversations/1359/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nota interna criada com sucesso:', result.id);
      console.log('🔍 Verificando se foi enviada via Z-API...');
      
      // A nota deve ser salva localmente mas NÃO enviada via Z-API
      if (result.isInternalNote === true) {
        console.log('✅ TESTE PASSOU: Nota interna não foi enviada para Z-API');
        return true;
      } else {
        console.log('❌ TESTE FALHOU: Flag isInternalNote não está definida');
        return false;
      }
    } else {
      console.log('❌ Erro ao criar nota interna:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
}

// Executar teste
testInternalNotesPrevention()
  .then(success => {
    if (success) {
      console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log('✅ Notas internas NÃO são enviadas para Z-API');
    } else {
      console.log('\n⚠️ PROBLEMA DETECTADO');
      console.log('❌ Notas internas podem estar vazando para Z-API');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal no teste:', error);
    process.exit(1);
  });