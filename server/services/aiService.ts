import OpenAI from 'openai';
import { db } from '../core/db';
import { aiLogs, aiContext, aiSessions } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Perplexity API integration for factual research
class PerplexityService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async searchFactualInfo(query: string): Promise<string | null> {
    if (!this.apiKey) {
      console.log('⚠️ Perplexity API key não configurada, usando apenas OpenAI');
      return null;
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente de pesquisa especializado em educação. Forneça informações factuais e atualizadas.'
            },
            {
              role: 'user',
              content: `Pesquise informações atualizadas sobre: ${query}`
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('❌ Erro na pesquisa Perplexity:', error);
      return null;
    }
  }
}

const perplexityService = new PerplexityService();

export interface MessageClassification {
  intent: 'lead_generation' | 'student_support' | 'complaint' | 'general_info' | 'spam' | 'course_inquiry' | 'technical_support' | 'financial';
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'excited';
  confidence: number; // 0-100
  isLead: boolean;
  isStudent: boolean;
  frustrationLevel: number; // 0-10
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedTeam: 'comercial' | 'suporte' | 'pedagogico' | 'financeiro' | 'supervisao';
  aiMode: 'mentor' | 'consultora';
  contextKeywords: string[];
  userProfile: {
    type: 'lead' | 'student' | 'visitor' | 'unknown';
    stage: string;
    interests: string[];
  };
}

export interface AIResponse {
  message: string;
  classification: MessageClassification;
  shouldHandoff: boolean;
  handoffReason?: string;
  suggestedActions: string[];
  processingTime: number;
  contextUsed: string[];
}

export class AIService {
  private isAutoResponseEnabled: boolean = false; // Desativado por padrão
  
  setAutoResponse(enabled: boolean) {
    this.isAutoResponseEnabled = enabled;
    console.log(`🤖 Auto-resposta da Prof. Ana: ${enabled ? 'ATIVADA' : 'DESATIVADA'}`);
  }

  isAutoResponseActive(): boolean {
    return this.isAutoResponseEnabled;
  }
  
  /**
   * Classifica intenção e sentimento de uma mensagem
   */
  async classifyMessage(
    message: string, 
    contactId: number, 
    conversationId: number,
    contactHistory?: any[]
  ): Promise<MessageClassification> {
    const startTime = Date.now();
    
    try {
      // Buscar contexto da conversa anterior
      const previousContext = await this.getConversationContext(conversationId);
      
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

      return classification;
      
    } catch (error) {
      console.error('❌ Erro na classificação de mensagem:', error);
      
      // Fallback para classificação básica
      return this.getFallbackClassification(message);
    }
  }

  /**
   * Gera resposta inteligente baseada na classificação
   */
  async generateResponse(
    message: string,
    classification: MessageClassification,
    contactId: number,
    conversationId: number
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Buscar contextos relevantes
      const relevantContexts = await this.searchRelevantContext(message, classification.contextKeywords);
      
      // Para perguntas factuais, usar Perplexity se disponível
      let perplexityInfo = null;
      if (classification.intent === 'general_info' || classification.intent === 'course_inquiry') {
        const shouldUsePerplexity = classification.contextKeywords.some(keyword => 
          ['tendências', 'mercado', 'profissão', 'carreira', 'salário', 'atualizações'].includes(keyword.toLowerCase())
        );
        
        if (shouldUsePerplexity) {
          perplexityInfo = await perplexityService.searchFactualInfo(message);
        }
      }
      
      // Preparar prompt baseado no modo da Prof. Ana
      const responsePrompt = this.buildResponsePrompt(message, classification, relevantContexts, perplexityInfo);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.getPersonalityPrompt(classification.aiMode)
          },
          {
            role: "user",
            content: responsePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiMessage = response.choices[0].message.content || '';
      
      // Determinar se precisa transferir para humano
      const shouldHandoff = this.shouldTransferToHuman(classification);
      const handoffReason = shouldHandoff ? this.getHandoffReason(classification) : undefined;
      
      // Sugerir ações automáticas
      const suggestedActions = this.getSuggestedActions(classification);
      
      const processingTime = Date.now() - startTime;
      
      // Log da resposta gerada
      await this.logInteraction({
        conversationId,
        contactId,
        userMessage: message,
        aiResponse: aiMessage,
        classification: classification.intent,
        sentiment: classification.sentiment,
        confidenceScore: classification.confidence,
        processingTime,
        handoffReason
      });

      return {
        message: aiMessage,
        classification,
        shouldHandoff,
        handoffReason,
        suggestedActions,
        processingTime,
        contextUsed: relevantContexts.map(c => c.name)
      };
      
    } catch (error) {
      console.error('❌ Erro na geração de resposta:', error);
      throw new Error('Falha ao gerar resposta da IA');
    }
  }

  /**
   * Gera embeddings para texto usando OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Erro ao gerar embedding:', error);
      return [];
    }
  }

  /**
   * Busca contextos relevantes usando similaridade semântica
   */
  private async searchRelevantContext(message: string, keywords: string[]): Promise<any[]> {
    try {
      // Buscar contextos ativos
      const contexts = await db.select()
        .from(aiContext)
        .where(eq(aiContext.isActive, true))
        .orderBy(desc(aiContext.createdAt))
        .limit(10);
      
      // Para simplicidade inicial, buscar por palavras-chave
      const relevantContexts = contexts.filter(context => {
        const contentLower = context.content.toLowerCase();
        const messageLower = message.toLowerCase();
        
        return keywords.some(keyword => 
          contentLower.includes(keyword.toLowerCase()) ||
          messageLower.includes(context.name.toLowerCase())
        );
      });
      
      return relevantContexts.slice(0, 3); // Limitar a 3 contextos mais relevantes
    } catch (error) {
      console.error('❌ Erro ao buscar contexto relevante:', error);
      return [];
    }
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
   * Constrói prompt para resposta baseado no modo
   */
  private buildResponsePrompt(message: string, classification: MessageClassification, contexts: any[], perplexityInfo?: string | null): string {
    let prompt = `Mensagem do usuário: "${message}"\n`;
    prompt += `Intenção detectada: ${classification.intent}\n`;
    prompt += `Sentimento: ${classification.sentiment}\n`;
    prompt += `Perfil: ${classification.userProfile.type}\n\n`;
    
    if (contexts.length > 0) {
      prompt += `Contextos relevantes:\n`;
      contexts.forEach((ctx, i) => {
        prompt += `${i + 1}. ${ctx.name}: ${ctx.content.substring(0, 200)}...\n`;
      });
      prompt += '\n';
    }

    if (perplexityInfo) {
      prompt += `Informações atualizadas (Perplexity):\n${perplexityInfo}\n\n`;
    }
    
    prompt += `Responda como Prof. Ana no modo ${classification.aiMode}.`;
    
    return prompt;
  }

  /**
   * Define personalidade da Prof. Ana baseado no modo
   */
  private getPersonalityPrompt(mode: 'mentor' | 'consultora'): string {
    if (mode === 'mentor') {
      return `Você é a Prof. Ana - Mentora Acadêmica. Seu objetivo é apoiar alunos matriculados.
      
      Características:
      - Tom acolhedor, confiante e paciente
      - Use frases como "Você está indo muito bem!", "Vamos resolver isso juntos."
      - Foque em tirar dúvidas, orientar acessos, ajudar com certificados
      - Finalize com "Sempre que precisar, conte comigo! Um abraço da Prof. Ana 💜"
      - Seja empática e educativa
      - Mantenha conversas focadas no suporte acadêmico`;
    } else {
      return `Você é a Prof. Ana - Consultora Educacional. Seu objetivo é convencer leads a se matricularem.
      
      Características:
      - Tom entusiástico, direto, motivador e conscientizador
      - Use frases como "Esse curso é ideal pra você!", "Posso te mostrar como garantir sua vaga com desconto."
      - Foque em apresentar cursos, coletar dados, enviar links de matrícula
      - Finalize com "Te espero na turma! Um abraço da Prof. Ana 💜"
      - Seja persuasiva mas não invasiva
      - Mantenha conversas focadas na conversão de leads`;
    }
  }

  /**
   * Determina se deve transferir para atendimento humano
   */
  private shouldTransferToHuman(classification: MessageClassification): boolean {
    return (
      classification.frustrationLevel >= 7 ||
      classification.urgency === 'critical' ||
      classification.confidence < 60 ||
      classification.intent === 'complaint' ||
      (classification.intent === 'technical_support' && classification.urgency === 'high')
    );
  }

  /**
   * Define razão para transferência
   */
  private getHandoffReason(classification: MessageClassification): string {
    if (classification.frustrationLevel >= 7) return 'Alto nível de frustração detectado';
    if (classification.urgency === 'critical') return 'Situação crítica requer atenção humana';
    if (classification.confidence < 60) return 'Baixa confiança na classificação';
    if (classification.intent === 'complaint') return 'Reclamação detectada';
    return 'Complexidade requer atendimento especializado';
  }

  /**
   * Sugere ações automáticas baseadas na classificação
   */
  private getSuggestedActions(classification: MessageClassification): string[] {
    const actions: string[] = [];
    
    if (classification.isLead) {
      actions.push('Registrar lead no CRM');
      actions.push('Enviar link de matrícula');
    }
    
    if (classification.isStudent) {
      actions.push('Verificar status acadêmico');
      actions.push('Disponibilizar recursos do aluno');
    }
    
    if (classification.intent === 'course_inquiry') {
      actions.push('Enviar informações do curso');
      actions.push('Agendar conversa comercial');
    }
    
    if (classification.intent === 'financial') {
      actions.push('Encaminhar para setor financeiro');
      actions.push('Enviar segunda via de boleto');
    }
    
    return actions;
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
   * Busca contexto da conversa
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
      
      return session?.sessionData || {};
    } catch (error) {
      console.error('❌ Erro ao buscar contexto da conversa:', error);
      return {};
    }
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

export const aiService = new AIService();