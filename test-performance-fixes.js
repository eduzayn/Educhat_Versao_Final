
console.log('🚀 EduChat Performance Testing Suite Loaded');

window.testMessagePerformance = async function() {
  console.log('📊 Testing message loading performance...');
  const startTime = performance.now();
  
  try {
    const response = await fetch('/api/conversations?limit=10&offset=0');
    const data = await response.json();
    
    const loadTime = performance.now() - startTime;
    console.log(`✅ Conversations loaded in ${loadTime.toFixed(2)}ms`);
    console.log(`📈 Found ${data.length} conversations`);
    
    if (loadTime > 1000) {
      console.warn(`⚠️ Slow loading detected: ${loadTime.toFixed(2)}ms`);
    }
    
    return { success: true, loadTime, count: data.length };
  } catch (error) {
    const loadTime = performance.now() - startTime;
    console.error(`❌ Error in performance test (${loadTime.toFixed(2)}ms):`, error);
    return { success: false, loadTime, error: error.message };
  }
};

window.testMediaLoading = async function(messageId) {
  console.log(`🎬 Testing media loading for message ${messageId}...`);
  const startTime = performance.now();
  
  try {
    const response = await fetch(`/api/messages/${messageId}/media`);
    const data = await response.json();
    
    const loadTime = performance.now() - startTime;
    console.log(`✅ Media loaded in ${loadTime.toFixed(2)}ms`);
    console.log(`📄 Type: ${data.messageType}, File: ${data.fileName}`);
    console.log(`⏱️ Server processing time: ${data.loadTime}`);
    
    if (loadTime > 3000) {
      console.warn(`⚠️ Slow media loading: ${loadTime.toFixed(2)}ms`);
    }
    
    return { success: true, loadTime, data };
  } catch (error) {
    const loadTime = performance.now() - startTime;
    console.error(`❌ Media loading error (${loadTime.toFixed(2)}ms):`, error);
    return { success: false, loadTime, error: error.message };
  }
};

window.testMessageDeletion = async function(messageId, conversationId) {
  console.log(`🗑️ Testing message deletion for message ${messageId}...`);
  const startTime = performance.now();
  
  try {
    const response = await fetch('/api/messages/soft-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, conversationId })
    });
    
    const data = await response.json();
    const deleteTime = performance.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ Message deleted in ${deleteTime.toFixed(2)}ms`);
      console.log(`⏱️ Server processing time: ${data.processingTime}`);
      return { success: true, deleteTime, data };
    } else {
      console.error(`❌ Deletion failed: ${data.error}`);
      return { success: false, deleteTime, error: data.error };
    }
  } catch (error) {
    const deleteTime = performance.now() - startTime;
    console.error(`❌ Deletion error (${deleteTime.toFixed(2)}ms):`, error);
    return { success: false, deleteTime, error: error.message };
  }
};

window.testSocketConnection = function() {
  console.log('🔌 Testing Socket.IO connection...');
  
  if (window.io && window.io.connected) {
    console.log('✅ Socket.IO connected successfully');
    return { success: true, connected: true };
  } else {
    console.warn('⚠️ Socket.IO not connected');
    return { success: false, connected: false };
  }
};

window.runFullPerformanceTest = async function() {
  console.log('🎯 Running comprehensive performance test...');
  
  const results = {
    messageLoading: await testMessagePerformance(),
    socketConnection: testSocketConnection(),
    mediaLoading: null,
    messageDeletion: null
  };
  
  if (results.messageLoading.success && results.messageLoading.count > 0) {
    results.mediaLoading = await testMediaLoading(1);
  }
  
  if (results.messageLoading.success && results.messageLoading.count > 0) {
    results.messageDeletion = await testMessageDeletion(1, 1);
  }
  
  console.log('📋 Performance Test Results:', results);
  return results;
};

console.log('📋 Available test functions:');
console.log('- testMessagePerformance() - Test conversation loading');
console.log('- testMediaLoading(messageId) - Test media loading');
console.log('- testMessageDeletion(messageId, conversationId) - Test deletion');
console.log('- testSocketConnection() - Test Socket.IO');
console.log('- runFullPerformanceTest() - Run all tests');
