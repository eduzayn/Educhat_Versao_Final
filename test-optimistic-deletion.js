/**
 * Teste de performance para exclusão otimista de mensagens
 * Verifica se a UI é atualizada instantaneamente
 */

const testOptimisticDeletion = async () => {
  console.log('🗑️ Testando exclusão otimista de mensagens...');
  
  // Simular clique no botão de exclusão
  const deleteButtons = document.querySelectorAll('[data-testid="delete-message"]');
  if (deleteButtons.length === 0) {
    console.warn('⚠️ Nenhum botão de exclusão encontrado');
    return;
  }
  
  const startTime = performance.now();
  const firstButton = deleteButtons[0];
  
  console.log('🎯 Clicando no botão de exclusão...');
  firstButton.click();
  
  // Aguardar um frame para ver se a UI foi atualizada
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  const uiUpdateTime = performance.now() - startTime;
  console.log(`⚡ UI atualizada em ${uiUpdateTime.toFixed(2)}ms`);
  
  // Verificar se apareceu o indicador "Excluindo..."
  const deletingIndicators = document.querySelectorAll('*');
  let foundDeletingText = false;
  
  for (const element of deletingIndicators) {
    if (element.textContent && element.textContent.includes('Excluindo...')) {
      foundDeletingText = true;
      console.log('✅ Indicador "Excluindo..." encontrado na UI');
      break;
    }
  }
  
  if (!foundDeletingText) {
    console.warn('⚠️ Indicador "Excluindo..." não encontrado');
  }
  
  // Verificar logs do console para confirmar atualização otimista
  const originalLog = console.log;
  let optimisticUpdateDetected = false;
  
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('marcada como deletada na UI instantaneamente')) {
      optimisticUpdateDetected = true;
      console.log('✅ Atualização otimista confirmada nos logs');
    }
    originalLog.apply(console, args);
  };
  
  // Restaurar console.log após teste
  setTimeout(() => {
    console.log = originalLog;
    
    console.log('📊 Resultado do teste de exclusão otimista:');
    console.log(`- Tempo de atualização da UI: ${uiUpdateTime.toFixed(2)}ms`);
    console.log(`- Indicador visual: ${foundDeletingText ? '✅' : '❌'}`);
    console.log(`- Atualização otimista: ${optimisticUpdateDetected ? '✅' : '❌'}`);
    
    if (uiUpdateTime < 100 && foundDeletingText) {
      console.log('🎉 Exclusão otimista funcionando perfeitamente!');
    } else {
      console.log('⚠️ Exclusão otimista precisa de ajustes');
    }
  }, 1000);
};

const testMessageDeletionFlow = async () => {
  console.log('🔄 Testando fluxo completo de exclusão...');
  
  // Verificar se há mensagens na tela
  const messages = document.querySelectorAll('[data-message-id]');
  console.log(`📝 ${messages.length} mensagens encontradas na tela`);
  
  if (messages.length === 0) {
    console.warn('⚠️ Nenhuma mensagem encontrada para testar exclusão');
    return;
  }
  
  // Testar se há botões de exclusão visíveis
  const deleteButtons = document.querySelectorAll('button[title*="excluir"], button[title*="deletar"], button[aria-label*="delete"]');
  console.log(`🗑️ ${deleteButtons.length} botões de exclusão encontrados`);
  
  // Verificar se há mensagens com estado de exclusão
  const deletedMessages = document.querySelectorAll('*');
  let deletingCount = 0;
  
  for (const element of deletedMessages) {
    if (element.textContent && element.textContent.includes('Excluindo...')) {
      deletingCount++;
    }
  }
  
  console.log(`🔄 ${deletingCount} mensagens em processo de exclusão`);
  
  // Verificar performance da lista de mensagens
  const startRender = performance.now();
  const messageList = document.querySelector('[data-testid="messages-list"]') || 
                     document.querySelector('.messages-container') ||
                     document.querySelector('[class*="message"]').parentElement;
  
  if (messageList) {
    const renderTime = performance.now() - startRender;
    console.log(`⚡ Lista de mensagens renderizada em ${renderTime.toFixed(2)}ms`);
  }
};

// Disponibilizar funções globalmente para teste manual
window.testOptimisticDeletion = testOptimisticDeletion;
window.testMessageDeletionFlow = testMessageDeletionFlow;

console.log('🔧 Funções de teste de exclusão carregadas:');
console.log('- testOptimisticDeletion() - Testa atualização imediata da UI');
console.log('- testMessageDeletionFlow() - Analisa fluxo completo de exclusão');