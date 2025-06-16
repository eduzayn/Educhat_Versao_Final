interface SocketMessage {
  messageId: number;
  conversationId: number;
  timestamp: number;
  processed: boolean;
}

class SocketOptimizations {
  private messageQueue: Map<number, SocketMessage> = new Map();
  private processingDelay = 100; // 100ms delay for batching

  queueMessage(messageId: number, conversationId: number) {
    const socketMessage: SocketMessage = {
      messageId,
      conversationId,
      timestamp: Date.now(),
      processed: false
    };

    this.messageQueue.set(messageId, socketMessage);
    
    setTimeout(() => {
      this.processMessage(messageId);
    }, this.processingDelay);
  }

  private processMessage(messageId: number) {
    const message = this.messageQueue.get(messageId);
    if (!message || message.processed) return;

    message.processed = true;
    console.log(`📡 Processando mensagem Socket.IO: ${messageId}`);
    
    const event = new CustomEvent('socketMessageReceived', {
      detail: { messageId: message.messageId, conversationId: message.conversationId }
    });
    
    window.dispatchEvent(event);
  }

  clearProcessedMessages() {
    const now = Date.now();
    const maxAge = 60000; // 1 minuto
    
    for (const [messageId, message] of this.messageQueue.entries()) {
      if (message.processed && (now - message.timestamp) > maxAge) {
        this.messageQueue.delete(messageId);
      }
    }
  }

  getQueueStats() {
    const messages = Array.from(this.messageQueue.values());
    return {
      total: messages.length,
      processed: messages.filter(m => m.processed).length,
      pending: messages.filter(m => !m.processed).length,
      oldestPending: messages
        .filter(m => !m.processed)
        .sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp || null
    };
  }
}

export const socketOptimizations = new SocketOptimizations();

setInterval(() => {
  socketOptimizations.clearProcessedMessages();
}, 30000);
