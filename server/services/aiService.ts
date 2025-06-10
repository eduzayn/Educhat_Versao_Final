import OpenAI from 'openai';
import { db } from '../core/db';
import { aiLogs, aiContext, aiSessions, aiMemory } from '../../shared/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { perplexityService } from './perplexityService';
import { crmService } from './crmService';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      
      // Extrair e salvar memórias da mensagem
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
      // Buscar contexto da conversa com memória contextual
      const conversationContext = await this.getConversationContext(conversationId);
      
      // Buscar contextos relevantes
      const relevantContexts = await this.searchRelevantContext(message, classification.contextKeywords);
      
      // Buscar conhecimento externo se necessário
      const internalContext = relevantContexts.map(c => c.content).join(' ');
      const externalKnowledge = await this.searchExternalKnowledge(message, internalContext, classification.confidence);
      
      // Preparar prompt baseado no modo da Prof. Ana incluindo memória contextual
      const responsePrompt = this.buildResponsePrompt(message, classification, relevantContexts, externalKnowledge, conversationContext.contextualInfo || '');
      
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
   * Busca informação externa usando Perplexity quando contexto interno é insuficiente
   */
  private async searchExternalKnowledge(message: string, internalContext: string, confidence: number): Promise<string | null> {
    try {
      const hasRelevantContext = internalContext.length > 100; // Contexto mínimo significativo
      
      if (perplexityService.shouldSearchExternal(confidence, hasRelevantContext)) {
        console.log(`🔍 Buscando conhecimento externo - Confiança: ${confidence}%, Contexto: ${hasRelevantContext ? 'Sim' : 'Não'}`);
        
        const externalResponse = await perplexityService.searchExternal(message, internalContext);
        
        if (externalResponse && perplexityService.validateExternalResponse(externalResponse)) {
          console.log('✅ Conhecimento externo validado e aprovado');
          return externalResponse;
        } else {
          console.log('⚠️ Conhecimento externo rejeitado por baixa qualidade');
          return null;
        }
      }
      
      console.log(`📊 Busca externa não necessária - Confiança: ${confidence}%`);
      return null;
    } catch (error) {
      console.error('❌ Erro na busca externa:', error);
      return null;
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
  private buildResponsePrompt(message: string, classification: MessageClassification, contexts: any[], externalKnowledge?: string | null, contextualMemory?: string): string {
    let prompt = `Mensagem do usuário: "${message}"\n`;
    prompt += `Intenção detectada: ${classification.intent}\n`;
    prompt += `Sentimento: ${classification.sentiment}\n`;
    prompt += `Perfil: ${classification.userProfile.type}\n\n`;
    
    // Incluir memória contextual se disponível
    if (contextualMemory) {
      prompt += contextualMemory + '\n';
    }
    
    if (contexts.length > 0) {
      prompt += `Contextos relevantes da base de conhecimento:\n`;
      contexts.forEach((ctx, i) => {
        prompt += `${i + 1}. ${ctx.name}: ${ctx.content.substring(0, 200)}...\n`;
      });
      prompt += '\n';
    }
    
    if (externalKnowledge) {
      prompt += `Informações complementares atualizadas:\n${externalKnowledge}\n\n`;
    }
    
    prompt += `Responda como Prof. Ana no modo ${classification.aiMode}.\n`;
    prompt += `IMPORTANTE: Use as informações da memória contextual para personalizar sua resposta. Seja concisa, empática e sempre ofereça próximos passos claros.`;
    
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
   * Salva informação na memória contextual
   */
  private async saveToMemory(data: {
    sessionId?: number;
    conversationId: number;
    contactId: number;
    memoryType: 'user_info' | 'preferences' | 'context' | 'history';
    key: string;
    value: string;
    confidence?: number;
    source?: string;
    expiresAt?: Date;
  }): Promise<void> {
    try {
      // Verificar se já existe uma memória com a mesma chave
      const existingMemory = await db.select()
        .from(aiMemory)
        .where(and(
          eq(aiMemory.conversationId, data.conversationId),
          eq(aiMemory.contactId, data.contactId),
          eq(aiMemory.memoryType, data.memoryType),
          eq(aiMemory.key, data.key),
          eq(aiMemory.isActive, true)
        ))
        .limit(1);

      if (existingMemory.length > 0) {
        // Atualizar memória existente
        await db.update(aiMemory)
          .set({
            value: data.value,
            confidence: data.confidence || 100,
            source: data.source || 'ai',
            updatedAt: new Date(),
          })
          .where(eq(aiMemory.id, existingMemory[0].id));
      } else {
        // Criar nova memória
        await db.insert(aiMemory).values({
          sessionId: data.sessionId,
          conversationId: data.conversationId,
          contactId: data.contactId,
          memoryType: data.memoryType,
          key: data.key,
          value: data.value,
          confidence: data.confidence || 100,
          source: data.source || 'ai',
          expiresAt: data.expiresAt,
        });
      }

      console.log(`💾 Memória salva: ${data.memoryType}/${data.key} = ${data.value}`);
    } catch (error) {
      console.error('❌ Erro ao salvar memória:', error);
    }
  }

  /**
   * Extrai e salva informações importantes da mensagem na memória
   */
  private async extractAndSaveMemories(
    message: string, 
    classification: MessageClassification, 
    conversationId: number, 
    contactId: number, 
    sessionId?: number
  ): Promise<void> {
    try {
      // Extrair nome se mencionado
      const nameMatch = message.match(/(?:meu nome é|me chamo|sou (?:a|o) )\s*([A-Za-záêîôûâçã\s]+)/i);
      if (nameMatch) {
        await this.saveToMemory({
          sessionId,
          conversationId,
          contactId,
          memoryType: 'user_info',
          key: 'nome',
          value: nameMatch[1].trim(),
          confidence: 90,
          source: 'user'
        });
      }

      // Extrair interesse em cursos
      const courseMatch = message.match(/(?:interesse|quero|gostaria|preciso).*(?:curso|graduação|especialização).*([A-Za-záêîôûâçã\s]+)/i);
      if (courseMatch || classification.intent === 'course_inquiry') {
        await this.saveToMemory({
          sessionId,
          conversationId,
          contactId,
          memoryType: 'preferences',
          key: 'curso_interesse',
          value: courseMatch ? courseMatch[1].trim() : 'Interesse geral em cursos',
          confidence: classification.intent === 'course_inquiry' ? 80 : 60
        });
      }

      // Salvar problemas ou reclamações
      if (classification.intent === 'complaint' || classification.sentiment === 'frustrated') {
        await this.saveToMemory({
          sessionId,
          conversationId,
          contactId,
          memoryType: 'history',
          key: 'problema_anterior',
          value: message.substring(0, 200),
          confidence: 70
        });
      }

      // Salvar contexto da conversa atual
      await this.saveToMemory({
        sessionId,
        conversationId,
        contactId,
        memoryType: 'context',
        key: 'ultima_intencao',
        value: classification.intent,
        confidence: classification.confidence
      });

      await this.saveToMemory({
        sessionId,
        conversationId,
        contactId,
        memoryType: 'context',
        key: 'ultimo_sentimento',
        value: classification.sentiment,
        confidence: classification.confidence
      });

    } catch (error) {
      console.error('❌ Erro ao extrair e salvar memórias:', error);
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