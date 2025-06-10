import { handoffService } from './handoffService.js';
import { storage } from '../storage/index.js';

interface MessageAnalysis {
  urgencyKeywords: string[];
  supportKeywords: string[];
  salesKeywords: string[];
  billingKeywords: string[];
  frustrationKeywords: string[];
}

const KEYWORDS: MessageAnalysis = {
  urgencyKeywords: [
    'urgente', 'emergência', 'problema', 'erro', 'não funciona', 'quebrado',
    'parou', 'ajuda', 'socorro', 'rápido', 'imediato', 'agora'
  ],
  supportKeywords: [
    'técnico', 'suporte', 'problema', 'erro', 'bug', 'não consegue',
    'dificuldade', 'travou', 'sistema', 'plataforma', 'login',
    'acesso', 'senha', 'conectar'
  ],
  salesKeywords: [
    'comprar', 'preço', 'valor', 'curso', 'matrícula', 'inscrição',
    'cadastro', 'interesse', 'informação', 'detalhes', 'proposta',
    'orçamento', 'plano', 'modalidade'
  ],
  billingKeywords: [
    'cobrança', 'pagamento', 'fatura', 'boleto', 'cartão', 'pix',
    'financeiro', 'parcela', 'desconto', 'valor', 'mensalidade',
    'anuidade', 'conta', 'débito'
  ],
  frustrationKeywords: [
    'irritado', 'chateado', 'decepcionado', 'péssimo', 'horrível',
    'cancelar', 'desistir', 'reclamar', 'insatisfeito', 'ruim',
    'pior', 'nunca mais', 'absurdo'
  ]
};

export class AutoHandoffService {
  /**
   * Analisa uma nova mensagem e determina se precisa de handoff automático
   */
  async analyzeAndHandoff(conversationId: number, messageContent: string): Promise<void> {
    try {
      // Buscar mensagens recentes da conversa
      const messages = await storage.getMessages(conversationId, 10);
      
      if (!messages || messages.length === 0) {
        return;
      }

      // Combinar as últimas 5 mensagens para análise
      const recentMessages = messages.slice(-5);
      const messageTexts = recentMessages
        .filter(msg => msg.content && msg.content.trim())
        .map(msg => msg.content)
        .join(' ');

      const combinedText = (messageTexts + ' ' + messageContent).toLowerCase();

      // Análise de palavras-chave
      const analysis = this.analyzeMessage(combinedText);
      
      // Verificar se precisa de handoff baseado na análise
      if (!this.shouldTriggerHandoff(analysis)) {
        return;
      }

      // Criar classificação da IA
      const aiClassification = {
        confidence: this.calculateConfidence(analysis),
        urgency: analysis.hasUrgency ? 'high' : 'normal',
        frustrationLevel: this.calculateFrustrationLevel(analysis),
        intent: this.determineIntent(analysis)
      };

      console.log(`🤖 Análise automática para conversa ${conversationId}:`, {
        intent: aiClassification.intent,
        urgency: aiClassification.urgency,
        confidence: aiClassification.confidence,
        frustrationLevel: aiClassification.frustrationLevel
      });

      // Avaliar se realmente precisa de handoff usando o endpoint existente
      const evaluationResponse = await fetch(`http://localhost:5000/api/handoffs/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          aiClassification
        })
      });

      if (!evaluationResponse.ok) {
        console.log(`❌ Erro na avaliação de handoff para conversa ${conversationId}`);
        return;
      }

      const evaluation = await evaluationResponse.json();

      if (!evaluation.shouldHandoff) {
        console.log(`📋 Handoff automático não necessário para conversa ${conversationId}`);
        return;
      }

      // Criar handoff automático usando o endpoint existente
      const handoffResponse = await fetch(`http://localhost:5000/api/handoffs/auto-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          aiClassification
        })
      });

      if (!handoffResponse.ok) {
        console.log(`❌ Erro ao criar handoff automático para conversa ${conversationId}`);
        return;
      }

      const result = await handoffResponse.json();

      if (result.handoffCreated) {
        console.log(`✅ Handoff automático criado para conversa ${conversationId}: ${result.suggestion?.reason}`);
        
        // Broadcast atualização da conversa para atualizar o cabeçalho
        await this.broadcastConversationUpdate(conversationId);
      }

    } catch (error) {
      console.error(`❌ Erro no handoff automático para conversa ${conversationId}:`, error);
    }
  }

  /**
   * Faz broadcast da atualização da conversa para o frontend
   */
  private async broadcastConversationUpdate(conversationId: number) {
    try {
      // Buscar dados atualizados da conversa usando o método correto
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        console.log(`❌ Conversa ${conversationId} não encontrada para broadcast`);
        return;
      }

      // Broadcast para todos os clientes conectados
      const { broadcastToAll } = await import('../routes/realtime');
      broadcastToAll({
        type: 'conversation_updated',
        conversationId: conversationId,
        conversation: conversation
      });

      console.log(`🔄 Broadcast enviado: conversa ${conversationId} atualizada`);
    } catch (error) {
      console.error(`❌ Erro ao enviar broadcast da conversa ${conversationId}:`, error);
    }
  }

  /**
   * Analisa o texto da mensagem
   */
  private analyzeMessage(text: string) {
    const hasUrgency = KEYWORDS.urgencyKeywords.some(keyword => text.includes(keyword));
    const hasSupport = KEYWORDS.supportKeywords.some(keyword => text.includes(keyword));
    const hasSales = KEYWORDS.salesKeywords.some(keyword => text.includes(keyword));
    const hasBilling = KEYWORDS.billingKeywords.some(keyword => text.includes(keyword));
    const hasFrustration = KEYWORDS.frustrationKeywords.some(keyword => text.includes(keyword));

    return {
      hasUrgency,
      hasSupport,
      hasSales,
      hasBilling,
      hasFrustration,
      textLength: text.length
    };
  }

  /**
   * Determina se deve acionar handoff automático
   */
  private shouldTriggerHandoff(analysis: any): boolean {
    // Handoff obrigatório para casos urgentes
    if (analysis.hasUrgency) {
      return true;
    }

    // Handoff para suporte técnico
    if (analysis.hasSupport) {
      return true;
    }

    // Handoff para vendas com interesse específico
    if (analysis.hasSales) {
      return true;
    }

    // Handoff para questões financeiras
    if (analysis.hasBilling) {
      return true;
    }

    // Handoff para clientes frustrados
    if (analysis.hasFrustration) {
      return true;
    }

    return false;
  }

  /**
   * Determina a intenção da conversa
   */
  private determineIntent(analysis: any): string {
    if (analysis.hasSupport) return 'technical_support';
    if (analysis.hasSales) return 'sales_inquiry';
    if (analysis.hasBilling) return 'billing_issue';
    if (analysis.hasFrustration) return 'complaint_resolution';
    return 'general_inquiry';
  }

  /**
   * Calcula nível de confiança da análise
   */
  private calculateConfidence(analysis: any): number {
    let confidence = 50; // Base

    // Aumentar confiança baseado em indicadores claros
    if (analysis.hasUrgency) confidence += 20;
    if (analysis.hasSupport) confidence += 15;
    if (analysis.hasSales) confidence += 15;
    if (analysis.hasBilling) confidence += 15;
    if (analysis.hasFrustration) confidence += 25;

    // Ajustar baseado no tamanho do texto
    if (analysis.textLength > 100) confidence += 10;
    if (analysis.textLength < 20) confidence -= 10;

    return Math.min(95, Math.max(60, confidence));
  }

  /**
   * Calcula nível de frustração do cliente
   */
  private calculateFrustrationLevel(analysis: any): number {
    let level = 3; // Base neutra

    if (analysis.hasFrustration) level += 5;
    if (analysis.hasUrgency) level += 3;
    if (analysis.hasSupport && analysis.hasUrgency) level += 2;

    return Math.min(10, Math.max(1, level));
  }
}

export const autoHandoffService = new AutoHandoffService();