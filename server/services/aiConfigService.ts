/**
 * Serviço centralizado para gerenciar configurações de IA
 * Resolve o problema de produção onde as chaves estão no banco, não no environment
 */

import { db } from '../db';
import { aiConfig } from '../../shared/schema';

interface AIConfigData {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  perplexityApiKey?: string;
  elevenlabsApiKey?: string;
  responseSettings?: {
    maxTokens: number;
    temperature: number;
    model: string;
  };
  isActive: boolean;
}

class AIConfigService {
  private cachedConfig: AIConfigData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca configurações de IA do banco de dados com cache
   */
  async getConfig(): Promise<AIConfigData | null> {
    const now = Date.now();
    
    // Usar cache se ainda válido
    if (this.cachedConfig && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedConfig;
    }

    try {
      console.log('🔧 Buscando configurações de IA do banco de dados...');
      
      const [config] = await db.select().from(aiConfig).limit(1);
      
      if (!config) {
        console.log('⚠️ Nenhuma configuração de IA encontrada no banco');
        // Fallback para variáveis de ambiente como backup
        const fallbackConfig: AIConfigData = {
          openaiApiKey: process.env.OPENAI_API_KEY,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          perplexityApiKey: process.env.PERPLEXITY_API_KEY,
          elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
          responseSettings: {
            maxTokens: 1000,
            temperature: 0.7,
            model: 'claude-3-sonnet-20240229'
          },
          isActive: true
        };
        
        // Verificar se pelo menos uma chave está disponível
        if (!fallbackConfig.openaiApiKey && !fallbackConfig.anthropicApiKey) {
          console.log('❌ Nenhuma API key disponível (banco ou environment)');
          return null;
        }
        
        this.cachedConfig = fallbackConfig;
        this.lastFetch = now;
        return fallbackConfig;
      }

      const configData: AIConfigData = {
        openaiApiKey: config.openaiApiKey || undefined,
        anthropicApiKey: config.anthropicApiKey || undefined,
        perplexityApiKey: config.perplexityApiKey || undefined,
        elevenlabsApiKey: config.elevenlabsApiKey || undefined,
        responseSettings: config.responseSettings || {
          maxTokens: 1000,
          temperature: 0.7,
          model: 'claude-3-sonnet-20240229'
        },
        isActive: config.isActive ?? true
      };

      // Verificar se pelo menos uma chave está disponível
      if (!configData.openaiApiKey && !configData.anthropicApiKey) {
        console.log('⚠️ Configuração encontrada mas sem API keys válidas');
        return null;
      }

      console.log('✅ Configurações de IA carregadas:', {
        hasOpenAI: !!configData.openaiApiKey,
        hasAnthropic: !!configData.anthropicApiKey,
        hasPerplexity: !!configData.perplexityApiKey,
        isActive: configData.isActive
      });

      this.cachedConfig = configData;
      this.lastFetch = now;
      return configData;
      
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de IA:', error);
      return null;
    }
  }

  /**
   * Limpa o cache para forçar nova busca
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.lastFetch = 0;
  }

  /**
   * Verifica se a IA está ativa e configurada
   */
  async isAIAvailable(): Promise<boolean> {
    const config = await this.getConfig();
    return config !== null && config.isActive && (!!config.openaiApiKey || !!config.anthropicApiKey);
  }

  /**
   * Obtém chave da OpenAI
   */
  async getOpenAIKey(): Promise<string | null> {
    const config = await this.getConfig();
    return config?.openaiApiKey || null;
  }

  /**
   * Obtém chave da Anthropic
   */
  async getAnthropicKey(): Promise<string | null> {
    const config = await this.getConfig();
    return config?.anthropicApiKey || null;
  }

  /**
   * Obtém configurações de resposta
   */
  async getResponseSettings(): Promise<{ maxTokens: number; temperature: number; model: string }> {
    const config = await this.getConfig();
    return config?.responseSettings || {
      maxTokens: 1000,
      temperature: 0.7,
      model: 'claude-3-sonnet-20240229'
    };
  }
}

export const aiConfigService = new AIConfigService();
export default aiConfigService;