const testMessagePerformance = async () => {
  console.log('🧪 Testando performance de mensagens...');
  
  const startTime = performance.now();
  
  try {
    const response = await fetch('/api/conversations/1/messages');
    const data = await response.json();
    
    const loadTime = performance.now() - startTime;
    console.log(`📊 Mensagens carregadas em ${loadTime.toFixed(2)}ms`);
    console.log(`📈 Total de mensagens: ${data.messages?.length || 0}`);
    
    if (loadTime > 1000) {
      console.warn('⚠️ Carregamento lento detectado!');
    } else {
      console.log('✅ Performance adequada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

const testMediaLoading = async (messageId) => {
  console.log(`🎬 Testando carregamento de mídia para mensagem ${messageId}...`);
  
  const startTime = performance.now();
  
  try {
    const response = await fetch(`/api/messages/${messageId}/media`);
    const data = await response.json();
    
    const loadTime = performance.now() - startTime;
    console.log(`📊 Mídia carregada em ${loadTime.toFixed(2)}ms`);
    
    if (data.content) {
      console.log('✅ Conteúdo de mídia carregado com sucesso');
    } else {
      console.warn('⚠️ Conteúdo de mídia vazio');
    }
    
  } catch (error) {
    console.error('❌ Erro no carregamento de mídia:', error);
  }
};

const testMessageDeletion = async (messageId, conversationId) => {
  console.log(`🗑️ Testando exclusão da mensagem ${messageId}...`);
  
  const startTime = performance.now();
  
  try {
    const response = await fetch('/api/messages/soft-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId,
        conversationId
      })
    });
    
    const data = await response.json();
    const deleteTime = performance.now() - startTime;
    
    console.log(`📊 Exclusão processada em ${deleteTime.toFixed(2)}ms`);
    
    if (response.ok) {
      console.log('✅ Mensagem excluída com sucesso');
    } else {
      console.warn(`⚠️ Erro na exclusão: ${data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na exclusão:', error);
  }
};

window.testMessagePerformance = testMessagePerformance;
window.testMediaLoading = testMediaLoading;
window.testMessageDeletion = testMessageDeletion;

console.log('🔧 Funções de teste carregadas:');
console.log('- testMessagePerformance()');
console.log('- testMediaLoading(messageId)');
console.log('- testMessageDeletion(messageId, conversationId)');
