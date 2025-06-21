/**
 * Componente de input de mensagem otimizado com UI otimista
 * Demonstra uso do sistema unificado de mensagens
 */

import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { useOptimizedMessageSystem } from '@/shared/lib/hooks/useOptimizedMessageSystem';
import { useMessagePerformanceMonitor } from '@/shared/lib/hooks/useMessagePerformanceMonitor';
import { Loader2, Send, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface OptimizedMessageInputProps {
  conversationId: number;
  onMessageSent?: () => void;
}

export function OptimizedMessageInput({ conversationId, onMessageSent }: OptimizedMessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { metrics, getPerformanceReport } = useMessagePerformanceMonitor();
  
  const {
    sendMessage,
    isPending,
    isSocketConnected,
    pendingMessages,
    retryMessage,
    errorCount
  } = useOptimizedMessageSystem({
    conversationId,
    onMessageSent: (message) => {
      setContent('');
      onMessageSent?.();
      console.log(`✅ Mensagem ${message.id} enviada com sucesso via sistema otimizado`);
    },
    onMessageError: (error, optimisticId) => {
      console.error(`❌ Erro na mensagem ${optimisticId}:`, error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isPending) return;

    const startTime = performance.now();
    console.log(`📤 SISTEMA OTIMIZADO: Enviando mensagem via ${isSocketConnected ? 'Socket.IO' : 'REST'}`);

    try {
      await sendMessage({
        content: content.trim(),
        messageType: 'text',
        isInternalNote: false
      });

      const duration = performance.now() - startTime;
      console.log(`⚡ SISTEMA OTIMIZADO: Processamento completo em ${duration.toFixed(1)}ms`);
      
    } catch (error) {
      console.error('❌ SISTEMA OTIMIZADO: Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const performanceReport = getPerformanceReport();
  const hasErrors = pendingMessages.some(msg => msg.status === 'error');

  return (
    <div className="space-y-2">
      {/* Status do sistema */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isSocketConnected ? (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-3 w-3" />
            <span>Socket.IO ativo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-yellow-600">
            <WifiOff className="h-3 w-3" />
            <span>Fallback REST</span>
          </div>
        )}
        
        {performanceReport.renderPerformance.isOptimal && (
          <span className="text-green-600">
            Performance ótima ({performanceReport.renderPerformance.average.toFixed(1)}ms)
          </span>
        )}
        
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{errorCount} erros</span>
          </div>
        )}
      </div>

      {/* Mensagens com erro para retry */}
      {hasErrors && (
        <div className="space-y-1">
          {pendingMessages
            .filter(msg => msg.status === 'error')
            .map(msg => (
              <div key={msg.optimisticId} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                <span className="flex-1">Erro ao enviar: "{msg.content}"</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryMessage(msg.optimisticId)}
                  className="text-red-600 border-red-300 hover:bg-red-100"
                >
                  Tentar novamente
                </Button>
              </div>
            ))
          }
        </div>
      )}

      {/* Input de mensagem */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          disabled={isPending}
        />
        
        <Button
          type="submit"
          disabled={!content.trim() || isPending}
          className="self-end"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Métricas de performance (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && metrics.averageRenderTime > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Render médio: {metrics.averageRenderTime.toFixed(1)}ms (target: <50ms)</div>
          <div>P95: {metrics.p95RenderTime.toFixed(1)}ms | P99: {metrics.p99RenderTime.toFixed(1)}ms</div>
          {performanceReport.recommendations.length > 0 && (
            <div className="text-yellow-600">
              Recomendação: {performanceReport.recommendations[0]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}