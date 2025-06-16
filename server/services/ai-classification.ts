import OpenAI from 'openai';
import { MessageClassification } from './ai-types';
import { db } from '../core/db';
import { aiLogs, aiContext, aiSessions, aiMemory } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIClassification {
  /**
   * Classifica intenção e sentimento de uma mensagem
   */
  async classifyMessage(message: string): Promise<MessageClassification>;
  async classifyMessage(
    message: string, 
    contactId: number, 
    conversationId: number,
    contactHistory?: any[]
  ): Promise<MessageClassification>;
  async classifyMessage(
    message: string, 
    contactId?: number, 
    conversationId?: number,
    contactHistory?: any[]
  ): Promise<MessageClassification> {
    const startTime = Date.now();
    
    try {
      // Buscar contexto da conversa anterior (opcional para handoffs)
      const previousContext = conversationId ? await this.getConversationContext(conversationId) : null;
      
      // Preparar prompt para classificação
      const classificationPrompt = this.buildClassificationPrompt(message, contactHistory, previousContext);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é o motor de classificação da Prof. Ana, assistente de IA educacional.
            
            Analise a mensagem e retorne a classificação em JSON no formato:
            {
              "intent": "lead_generation|student_support|complaint|general_info|spam|course_inquiry|technical_support|financial",
              "sentiment": "positive|neutral|negative|frustrated|excited",
              "confidence": 85,
              "isLead": true,
              "isStudent": false,
              "frustrationLevel": 3,
              "urgency": "medium",
              "suggestedTeam": "comercial",
              "aiMode": "consultora",
              "contextKeywords": ["curso", "valor", "matrícula"],
              "userProfile": {
                "type": "lead",
                "stage": "interesse_inicial",
                "interests": ["neuropsicopedagogia"]
              }
            }
            
            Regras de classificação:
            - frustrationLevel: 0-3=baixo, 4-6=médio, 7-10=alto
            - aiMode: "mentor" para alunos, "consultora" para leads
            - suggestedTeam baseado na intenção: comercial (vendas), suporte (técnico), pedagogico (acadêmico), financeiro (pagamentos)
            - confidence: precisão da classificação (0-100)
            - Detecte emojis, gírias e informalidade para sentimento
            - Identifique menções de cursos, valores, problemas técnicos`
          },
          {
            role: "user",
            content: classificationPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const classification = JSON.parse(response.choices[0].message.content || '{}');
      
      // Extrair e salvar memórias da mensagem (apenas se fornecido parâmetros)
      if (conversationId && contactId) {
        try {
          await this.extractAndSaveMemories(message, classification, conversationId, contactId);

          // Log da classificação
          await this.logInteraction({
            conversationId,
            contactId,
            userMessage: message,
            classification: classification.intent,
            sentiment: classification.sentiment,
            confidenceScore: classification.confidence,
            processingTime: Date.now() - startTime,
            aiResponse: JSON.stringify(classification)
          });
        } catch (logError) {
          // Falha no log não deve impedir a classificação
          console.warn('Erro ao salvar logs da classificação:', logError);
        }
      }

      return classification;
      
    } catch (error) {
      console.error('❌ Erro na classificação de mensagem:', error);
      
      // Fallback para classificação básica
      return this.getFallbackClassification(message);
    }
  }

  /**
   * Classificação fallback para casos de erro
   */
  private getFallbackClassification(message: string): MessageClassification {
    const messageLower = message.toLowerCase();
    let intent = 'general_info';
    let sentiment = 'neutral';
    let aiMode: 'mentor' | 'consultora' = 'consultora';
    
    // Detecção básica por palavras-chave
    if (messageLower.includes('curso') || messageLower.includes('matrícula')) {
      intent = 'course_inquiry';
    } else if (messageLower.includes('problema') || messageLower.includes('erro')) {
      intent = 'technical_support';
      sentiment = 'negative';
    } else if (messageLower.includes('certificado') || messageLower.includes('disciplina')) {
      intent = 'student_support';
      aiMode = 'mentor';
    }
    
    return {
      intent: intent as any,
      sentiment: sentiment as any,
      confidence: 50,
      isLead: intent === 'course_inquiry',
      isStudent: intent === 'student_support',
      frustrationLevel: sentiment === 'negative' ? 5 : 2,
      urgency: 'medium',
      suggestedTeam: intent === 'course_inquiry' ? 'comercial' : 'suporte',
      aiMode,
      contextKeywords: [],
      userProfile: {
        type: intent === 'course_inquiry' ? 'lead' : 'unknown',
        stage: 'inicial',
        interests: []
      }
    };
  }

  /**
   * Constrói prompt para classificação
   */
  private buildClassificationPrompt(message: string, history?: any[], context?: any): string {
    let prompt = `Mensagem para classificar: "${message}"`;
    
    if (history && history.length > 0) {
      prompt += `\n\nHistórico recente da conversa:`;
      history.slice(-3).forEach((msg, i) => {
        prompt += `\n${i + 1}. ${msg.fromMe ? 'Atendente' : 'Cliente'}: ${msg.text || '[mídia]'}`;
      });
    }
    
    if (context) {
      prompt += `\n\nContexto da sessão: ${JSON.stringify(context)}`;
    }
    
    return prompt;
  }

  /**
   * Busca contexto da conversa incluindo memória contextual
   */
  private async getConversationContext(conversationId: number): Promise<any> {
    try {
      const [session] = await db.select()
        .from(aiSessions)
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ))
        .orderBy(desc(aiSessions.lastInteraction))
        .limit(1);
      
      // Buscar memória contextual
      const memories = await this.getContextualMemory(conversationId, session?.contactId ?? undefined);
      
      return {
        sessionData: session?.sessionData || {},
        memories: memories,
        contextualInfo: this.formatMemoriesForPrompt(memories)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar contexto da conversa:', error);
      return {};
    }
  }

  /**
   * Busca memória contextual da sessão/contato
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
   * Formata memórias para uso no prompt
   */
  private formatMemoriesForPrompt(memories: any[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const categorizedMemories = {
      user_info: memories.filter(m => m.memoryType === 'user_info'),
      preferences: memories.filter(m => m.memoryType === 'preferences'),
      context: memories.filter(m => m.memoryType === 'context'),
      history: memories.filter(m => m.memoryType === 'history')
    };

    let contextString = '\n=== MEMÓRIA CONTEXTUAL ===\n';
    
    if (categorizedMemories.user_info.length > 0) {
      contextString += '\nInformações do usuário:\n';
      categorizedMemories.user_info.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.preferences.length > 0) {
      contextString += '\nPreferências:\n';
      categorizedMemories.preferences.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.context.length > 0) {
      contextString += '\nContexto da conversa:\n';
      categorizedMemories.context.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    if (categorizedMemories.history.length > 0) {
      contextString += '\nHistórico relevante:\n';
      categorizedMemories.history.forEach(m => {
        contextString += `- ${m.key}: ${m.value}\n`;
      });
    }

    contextString += '=== FIM DA MEMÓRIA ===\n';
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