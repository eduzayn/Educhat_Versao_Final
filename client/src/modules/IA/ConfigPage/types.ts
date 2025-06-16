export interface AIConfig {
  id: string;
  openaiApiKey: string;
  perplexityApiKey: string;
  elevenlabsApiKey: string;
  anthropicApiKey: string;
  enabledFeatures: {
    webSearch: boolean;
    voiceSynthesis: boolean;
    imageAnalysis: boolean;
    contextualMemory: boolean;
  };
  responseSettings: {
    maxTokens: number;
    temperature: number;
    model: string;
  };
  isActive: boolean;
} 