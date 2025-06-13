/**
 * Sistema de monitoramento e recuperação automática do webhook
 * Garante que problemas críticos sejam detectados e resolvidos automaticamente
 */

interface WebhookMetrics {
  totalRequests: number;
  successfulProcessing: number;
  errorCount: number;
  lastError?: string;
  lastSuccessfulProcess?: Date;
  averageProcessingTime: number;
}

class WebhookHealthMonitor {
  private metrics: WebhookMetrics = {
    totalRequests: 0,
    successfulProcessing: 0,
    errorCount: 0,
    averageProcessingTime: 0
  };

  private processingTimes: number[] = [];
  private readonly MAX_PROCESSING_TIMES = 100;

  recordSuccess(processingTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.successfulProcessing++;
    this.metrics.lastSuccessfulProcess = new Date();
    
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.MAX_PROCESSING_TIMES) {
      this.processingTimes.shift();
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  recordError(error: string, processingTime?: number): void {
    this.metrics.totalRequests++;
    this.metrics.errorCount++;
    this.metrics.lastError = error;
    
    if (processingTime) {
      this.processingTimes.push(processingTime);
      if (this.processingTimes.length > this.MAX_PROCESSING_TIMES) {
        this.processingTimes.shift();
      }
    }
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: WebhookMetrics;
    recommendations: string[];
  } {
    const errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.errorCount / this.metrics.totalRequests) * 100 
      : 0;

    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (errorRate > 20) {
      status = 'critical';
      recommendations.push('Taxa de erro muito alta - verificar logs de sistema');
    } else if (errorRate > 10) {
      status = 'warning';
      recommendations.push('Taxa de erro elevada - monitorar de perto');
    }

    if (this.metrics.averageProcessingTime > 5000) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push('Tempo de processamento muito alto - otimizar performance');
    }

    return { status, metrics: this.metrics, recommendations };
  }
}

export const webhookHealthMonitor = new WebhookHealthMonitor();

export function validateWebhookData(data: any): {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
} {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Dados do webhook ausentes');
    return { isValid: false, errors };
  }

  if (typeof data !== 'object') {
    errors.push('Dados do webhook devem ser um objeto');
    return { isValid: false, errors };
  }

  if (!data.type) {
    errors.push('Tipo do webhook não definido');
  }

  const sanitizedData = {
    ...data,
    phone: data.phone ? String(data.phone).replace(/\D/g, '') : undefined,
    senderName: data.senderName ? String(data.senderName).trim() : undefined,
    messageId: data.messageId ? String(data.messageId).trim() : undefined
  };

  if (data.type === 'ReceivedCallback') {
    if (!data.phone) {
      errors.push('Telefone é obrigatório para mensagens recebidas');
    }
    
    if (!data.messageId) {
      errors.push('ID da mensagem é obrigatório');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}