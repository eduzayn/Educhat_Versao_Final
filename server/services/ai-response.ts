import OpenAI from 'openai';
import { MessageClassification, AIResponse } from './ai-types';
import { db } from '../core/db';
import { aiLogs, aiContext, aiSessions, aiMemory } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

import { aiConfigService } from './aiConfigService';

// Inicializar OpenAI dinamicamente quando necessário
async function getOpenAI() {
  const openaiKey = await aiConfigService.getOpenAIKey();
  if (!openaiKey) {
    throw new Error('OpenAI API key não configurada');
  }
  return new OpenAI({ apiKey: openaiKey });
}

export class AIResponse {
  /**
   * Gera resposta baseada na classificação da mensagem
   */
  async generateResponse(
    message: string,
    classification: MessageClassification,
    conversationId: number,
    contactId: number,
    contactHistory?: any[]
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Buscar contexto relevante
      const context = await this.getRelevantContext(classification, conversationId, contactId);
      
      // Buscar conhecimento externo se necessário
      const externalKnowledge = await this.getExternalKnowledge(classification);
      
      // Preparar prompt para geração de resposta
      const responsePrompt = this.buildResponsePrompt(
        message,
        classification,
        context,
        externalKnowledge,
        contactHistory
      );
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é a Prof. Ana, assistente de IA educacional.
            
            Regras de resposta:
            - Mantenha tom profissional mas acolhedor
            - Use linguagem clara e objetiva
            - Evite jargões técnicos desnecessários
            - Personalize respostas baseado no perfil do usuário
            - Inclua exemplos práticos quando relevante
            - Mantenha foco no contexto educacional
            - Evite respostas muito longas
            - Use emojis com moderação
            - Mantenha consistência com respostas anteriores
            - Siga o modo de IA definido na classificação (mentor/consultora)`
          },
          {
            role: "user",
            content: responsePrompt
          }
        ],
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content || '';
      
      // Determinar se precisa de handoff
      const needsHandoff = this.shouldHandoffToHuman(classification, aiResponse);
      
      // Log da interação
      await this.logInteraction({
        conversationId,
        contactId,
        userMessage: message,
        aiResponse,
        classification: classification.intent,
        sentiment: classification.sentiment,
        confidenceScore: classification.confidence,
        processingTime: Date.now() - startTime,
        handoffReason: needsHandoff ? this.getHandoffReason(classification) : undefined
      });

      return {
        text: aiResponse,
        needsHandoff,
        handoffReason: needsHandoff ? this.getHandoffReason(classification) : undefined,
        suggestedTeam: classification.suggestedTeam
      };
      
    } catch (error) {
      console.error('❌ Erro ao gerar resposta:', error);
      
      // Fallback para resposta genérica
      return this.getFallbackResponse(classification);
    }
  }

  /**
   * Busca contexto relevante para a resposta
   */
  private async getRelevantContext(
    classification: MessageClassification,
    conversationId: number,
    contactId: number
  ): Promise<any> {
    try {
      // Buscar sessão ativa
      const [session] = await db.select()
        .from(aiSessions)
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ))
        .orderBy(desc(aiSessions.lastInteraction))
        .limit(1);

      // Buscar memória contextual
      const memories = await this.getContextualMemory(conversationId, contactId);
      
      // Buscar histórico de interações
      const interactions = await this.getInteractionHistory(conversationId);
      
      return {
        sessionData: session?.sessionData || {},
        memories: memories,
        interactions: interactions,
        contextualInfo: this.formatContextForPrompt(session, memories, interactions)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar contexto:', error);
      return {};
    }
  }

  /**
   * Busca conhecimento externo baseado na classificação
   */
  private async getExternalKnowledge(classification: MessageClassification): Promise<any> {
    // TODO: Implementar busca em base de conhecimento
    return {};
  }

  /**
   * Constrói prompt para geração de resposta
   */
  private buildResponsePrompt(
    message: string,
    classification: MessageClassification,
    context: any,
    externalKnowledge: any,
    history?: any[]
  ): string {
    let prompt = `Mensagem do usuário: "${message}"\n\n`;
    
    prompt += `Classificação:\n`;
    prompt += `- Intenção: ${classification.intent}\n`;
    prompt += `- Sentimento: ${classification.sentiment}\n`;
    prompt += `- Modo: ${classification.aiMode}\n`;
    prompt += `- Perfil: ${classification.userProfile.type} (${classification.userProfile.stage})\n`;
    
    if (history && history.length > 0) {
      prompt += `\nHistórico recente:\n`;
      history.slice(-3).forEach((msg, i) => {
        prompt += `${i + 1}. ${msg.fromMe ? 'Atendente' : 'Cliente'}: ${msg.text || '[mídia]'}\n`;
      });
    }
    
    if (context.contextualInfo) {
      prompt += `\n${context.contextualInfo}\n`;
    }
    
    if (Object.keys(externalKnowledge).length > 0) {
      prompt += `\nConhecimento relevante:\n${JSON.stringify(externalKnowledge, null, 2)}\n`;
    }
    
    prompt += `\nGere uma resposta apropriada considerando o contexto acima.`;
    
    return prompt;
  }

  /**
   * Determina se precisa de handoff para humano
   */
  private shouldHandoffToHuman(classification: MessageClassification, aiResponse: string): boolean {
    // Regras de handoff
    if (classification.frustrationLevel >= 7) return true;
    if (classification.confidence < 60) return true;
    if (classification.intent === 'complaint') return true;
    if (classification.urgency === 'high') return true;
    
    // Verificar se a resposta gerada indica necessidade de handoff
    const responseLower = aiResponse.toLowerCase();
    if (responseLower.includes('não posso ajudar') || 
        responseLower.includes('preciso transferir') ||
        responseLower.includes('vou encaminhar')) {
      return true;
    }
    
    return false;
  }

  /**
   * Obtém razão do handoff
   */
  private getHandoffReason(classification: MessageClassification): string {
    if (classification.frustrationLevel >= 7) {
      return 'Nível alto de frustração do usuário';
    }
    if (classification.confidence < 60) {
      return 'Baixa confiança na classificação';
    }
    if (classification.intent === 'complaint') {
      return 'Reclamação que requer atenção humana';
    }
    if (classification.urgency === 'high') {
      return 'Assunto urgente que requer atenção imediata';
    }
    return 'Transferência solicitada pelo assistente';
  }

  /**
   * Resposta fallback para casos de erro
   */
  private getFallbackResponse(classification: MessageClassification): AIResponse {
    const isStudent = classification.isStudent;
    const isLead = classification.isLead;
    
    let response = '';
    
    if (isStudent) {
      response = 'Olá! Parece que estou tendo dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes ou entre em contato com nossa equipe de suporte.';
    } else if (isLead) {
      response = 'Olá! Desculpe, estou enfrentando algumas dificuldades técnicas. Gostaria de falar com um de nossos consultores? Eles poderão te ajudar melhor.';
    } else {
      response = 'Desculpe, estou tendo dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes.';
    }
    
    return {
      text: response,
      needsHandoff: true,
      handoffReason: 'Erro técnico na geração de resposta',
      suggestedTeam: classification.suggestedTeam
    };
  }

  /**
   * Busca memória contextual
   */
  private async getContextualMemory(conversationId: number, contactId?: number): Promise<any[]> {
    try {
      const whereConditions = [eq(aiMemory.isActive, true)];
      
      if (conversationId) {
        whereConditions.push(eq(aiMemory.conversationId, conversationId));
      }
      
      if (contactId) {
        whereConditions.push(eq(aiMemory.contactId, contactId));
      }

      const memories = await db.select()
        .from(aiMemory)
        .where(and(...whereConditions))
        .orderBy(desc(aiMemory.updatedAt))
        .limit(20);

      return memories;
    } catch (error) {
      console.error('❌ Erro ao buscar memória contextual:', error);
      return [];
    }
  }

  /**
   * Busca histórico de interações
   */
  private async getInteractionHistory(conversationId: number): Promise<any[]> {
    try {
      const interactions = await db.select()
        .from(aiLogs)
        .where(eq(aiLogs.conversationId, conversationId))
        .orderBy(desc(aiLogs.createdAt))
        .limit(10);

      return interactions;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de interações:', error);
      return [];
    }
  }

  /**
   * Formata contexto para uso no prompt
   */
  private formatContextForPrompt(session: any, memories: any[], interactions: any[]): string {
    let contextString = '\n=== CONTEXTO DA CONVERSA ===\n';
    
    if (session?.sessionData) {
      contextString += '\nDados da sessão:\n';
      Object.entries(session.sessionData).forEach(([key, value]) => {
        contextString += `- ${key}: ${value}\n`;
      });
    }
    
    if (memories.length > 0) {
      contextString += '\nMemória contextual:\n';
      memories.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }
    
    if (interactions.length > 0) {
      contextString += '\nInterações recentes:\n';
      interactions.forEach(i => {
        contextString += `- ${i.classification} (${i.sentiment}): ${i.aiResponse}\n`;
      });
    }
    
    contextString += '=== FIM DO CONTEXTO ===\n';
    return contextString;
  }

  /**
   * Registra interação no log
   */
  private async logInteraction(data: {
    conversationId: number;
    contactId: number;
    userMessage: string;
    aiResponse?: string;
    classification: string;
    sentiment: string;
    confidenceScore: number;
    processingTime: number;
    handoffReason?: string;
  }): Promise<void> {
    try {
      await db.insert(aiLogs).values({
        conversationId: data.conversationId,
        contactId: data.contactId,
        classification: data.classification,
        sentiment: data.sentiment,
        confidence: data.confidenceScore,
        aiResponse: data.aiResponse,
        processingTime: data.processingTime,
        handoffReason: data.handoffReason
      });
    } catch (error) {
      console.error('❌ Erro ao registrar log de interação:', error);
    }
  }
} 