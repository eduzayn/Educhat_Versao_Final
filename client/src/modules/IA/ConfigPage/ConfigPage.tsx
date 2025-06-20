import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../../lib/queryClient';
import { useLocation } from 'wouter';
import { ConfigHeader } from './ConfigHeader';
import { ConfigStatusCard } from './ConfigStatusCard';
import { ConfigApiKeysCard } from './ConfigApiKeysCard';
import { ConfigFeaturesCard } from './ConfigFeaturesCard';
import { ConfigResponseSettingsCard } from './ConfigResponseSettingsCard';
import { AIConfig } from './types';

const defaultConfig: AIConfig = {
  id: '',
  openaiApiKey: '',
  perplexityApiKey: '',
  elevenlabsApiKey: '',
  anthropicApiKey: '',
  enabledFeatures: {
    webSearch: true,
    voiceSynthesis: false,
    imageAnalysis: true,
    contextualMemory: true,
  },
  responseSettings: {
    maxTokens: 2000,
    temperature: 0.7,
    model: 'gpt-4'
  },
  isActive: true
};

export function ConfigPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<AIConfig>(defaultConfig);

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/settings/integrations/ai/config'],
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations/ai/config');
      if (!response.ok) throw new Error('Falha ao carregar configurações');
      return response.json() as Promise<AIConfig>;
    }
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: AIConfig) => {
      const response = await fetch('/api/settings/integrations/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Falha ao salvar configurações');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations/ai/config'] });
      // Simular notificação de sucesso
      console.log('✅ Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Erro ao salvar configurações:', error);
    }
  });

  const handleBack = () => setLocation('/ia');
  const handleSave = () => saveMutation.mutate(formData);
  const handleToggleActive = (checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }));
  const handleApiKeyChange = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleFeatureToggle = (feature: string, enabled: boolean) => setFormData(prev => ({
    ...prev,
    enabledFeatures: { ...prev.enabledFeatures, [feature]: enabled }
  }));
  const handleSettingChange = (setting: string, value: string | number) => setFormData(prev => ({
    ...prev,
    responseSettings: { ...prev.responseSettings, [setting]: value }
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <ConfigHeader 
        isActive={formData.isActive} 
        onBack={handleBack} 
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      />
      <ConfigStatusCard isActive={formData.isActive} onToggle={handleToggleActive} />
      <ConfigApiKeysCard formData={formData} onApiKeyChange={handleApiKeyChange} />
      <ConfigFeaturesCard enabledFeatures={formData.enabledFeatures} onFeatureToggle={handleFeatureToggle} />
      <ConfigResponseSettingsCard responseSettings={formData.responseSettings} onSettingChange={handleSettingChange} />
    </div>
  );
} 