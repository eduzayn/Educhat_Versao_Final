import { OpenAI } from 'openai';
import { aiConfigService } from './aiConfigService';

/**
 * Serviço de IA para análise de conversas e atribuição inteligente
 */

interface AIAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  category: string;
  suggestedTeam?: string;
  confidence: number;
}

interface TeamCapacityAnalysis {
  teamId: number;
  currentLoad: number;
  capacity: number;
  availability: number;
  specializations: string[];
}

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Não inicializar aqui, inicializar dinamicamente quando necessário
  }

  /**
   * Analisa uma mensagem para determinar sentimento, urgência e categoria
   */
  async analyzeMessage(message: string, context?: string): Promise<AIAnalysisResult> {
    // Inicializar OpenAI dinamicamente
    const openaiKey = await aiConfigService.getOpenAIKey();
    if (!openaiKey) {
      console.log('⚠️ OpenAI não configurada, usando análise de fallback');
      return this.getFallbackAnalysis(message);
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    try {
      const prompt = `
        Analise a seguinte mensagem de cliente e forneça uma análise estruturada:
        
        Mensagem: "${message}"
        ${context ? `Contexto: ${context}` : ''}
        
        Retorne uma análise em formato JSON com:
        - sentiment: 'positive', 'negative' ou 'neutral'
        - urgency: 'low', 'medium' ou 'high'
        - category: categoria da mensagem (ex: 'suporte', 'vendas', 'reclamacao', 'duvida')
        - confidence: nível de confiança da análise (0-1)
      `;

      const responseSettings = await aiConfigService.getResponseSettings();
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: responseSettings.temperature,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content) as AIAnalysisResult;
        } catch {
          return this.getFallbackAnalysis(message);
        }
      }
    } catch (error) {
      console.error('❌ Erro na análise de IA OpenAI:', error);
    }

    return this.getFallbackAnalysis(message);
  }

  /**
   * Analisa capacidades das equipes para atribuição inteligente
   */
  async analyzeTeamCapacities(teams: any[]): Promise<TeamCapacityAnalysis[]> {
    return teams.map(team => ({
      teamId: team.id,
      currentLoad: team.activeConversations || 0,
      capacity: team.maxCapacity || 10,
      availability: Math.max(0, (team.maxCapacity || 10) - (team.activeConversations || 0)),
      specializations: team.specializations || []
    }));
  }

  /**
   * Sugere a melhor equipe para uma conversa baseada na análise
   */
  async suggestTeamAssignment(
    analysis: AIAnalysisResult,
    teamCapacities: TeamCapacityAnalysis[]
  ): Promise<number | null> {
    // Filtrar equipes com disponibilidade
    const availableTeams = teamCapacities.filter(team => team.availability > 0);
    
    if (availableTeams.length === 0) {
      return null;
    }

    // Priorizar por especialização se disponível
    const specializedTeams = availableTeams.filter(team =>
      team.specializations.includes(analysis.category)
    );

    const candidateTeams = specializedTeams.length > 0 ? specializedTeams : availableTeams;

    // Ordenar por disponibilidade (maior primeiro)
    candidateTeams.sort((a, b) => b.availability - a.availability);

    return candidateTeams[0].teamId;
  }

  /**
   * Análise de fallback quando IA não está disponível
   */
  private getFallbackAnalysis(message: string): AIAnalysisResult {
    const lowerMessage = message.toLowerCase();
    
    // Análise de sentimento básica
    const positiveWords = ['obrigado', 'ótimo', 'excelente', 'perfeito', 'satisfeito'];
    const negativeWords = ['problema', 'erro', 'ruim', 'péssimo', 'reclamação', 'urgente'];
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (positiveWords.some(word => lowerMessage.includes(word))) {
      sentiment = 'positive';
    } else if (negativeWords.some(word => lowerMessage.includes(word))) {
      sentiment = 'negative';
    }

    // Análise de urgência
    const urgentWords = ['urgente', 'emergência', 'problema', 'parou', 'não funciona'];
    const urgency = urgentWords.some(word => lowerMessage.includes(word)) ? 'high' : 'medium';

    // Categoria básica com prioridade para suporte
    let category = 'duvida';
    
    // Palavras-chave de suporte (alta prioridade)
    const suporteWords = ['suporte', 'técnico', 'problema', 'erro', 'bug', 'não funciona', 'parou', 'travou', 'lento', 'falha', 'defeito', 'quebrou', 'sistema', 'app', 'aplicativo', 'site', 'plataforma'];
    
    // Palavras-chave de vendas
    const vendasWords = ['comprar', 'preço', 'valor', 'custo', 'orçamento', 'produto', 'serviço', 'venda', 'adquirir', 'contratar'];
    
    if (suporteWords.some(word => lowerMessage.includes(word))) {
      category = 'suporte';
    } else if (vendasWords.some(word => lowerMessage.includes(word))) {
      category = 'vendas';
    }

    return {
      sentiment,
      urgency,
      category,
      confidence: 0.6
    };
  }

  /**
   * Gera resposta automática baseada no contexto
   */
  async generateAutoResponse(message: string, context: string): Promise<string | null> {
    const openaiKey = await aiConfigService.getOpenAIKey();
    if (!openaiKey) {
      console.log('⚠️ OpenAI não configurada para resposta automática');
      return null;
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    try {
      const prompt = `
        Gere uma resposta automática apropriada para a seguinte mensagem de cliente:
        
        Mensagem: "${message}"
        Contexto: ${context}
        
        A resposta deve ser:
        - Profissional e cordial
        - Breve (máximo 2 frases)
        - Informativa
        - Em português
      `;

      const responseSettings = await aiConfigService.getResponseSettings();
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: responseSettings.temperature,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('❌ Erro ao gerar resposta automática:', error);
      return null;
    }
  }
}

export const aiService = new AIService();
export default aiService;