import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Badge } from '../../shared/ui/badge';
import { Switch } from '../../shared/ui/switch';
import { Separator } from '../../shared/ui/separator';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { useLocation } from 'wouter';
// Temporarily simplified without toast for now
import { 
  Settings, 
  Key, 
  Brain, 
  Zap, 
  Mic, 
  Eye, 
  Save, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface AIConfig {
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

export function ConfigPage() {
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/ia/config'],
    queryFn: async () => {
      const response = await fetch('/api/ia/config');
      if (!response.ok) throw new Error('Falha ao carregar configurações');
      return response.json();
    }
  });

  const [formData, setFormData] = useState<Partial<AIConfig>>({
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
  });

  // Atualizar formData quando config carregar
  useState(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: Partial<AIConfig>) => {
      const response = await fetch('/api/ia/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Falha ao salvar configurações');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/config'] });
      console.log("Configurações salvas com sucesso");
    },
    onError: (error: Error) => {
      console.error("Erro ao salvar configurações:", error.message);
    }
  });

  const testApiKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const response = await fetch('/api/ia/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });
      if (!response.ok) throw new Error('Falha no teste da chave');
      return response.json();
    },
    onSuccess: (data, variables) => {
      setTestingKey(null);
      console.log(`Chave ${variables.provider} testada com sucesso`);
    },
    onError: (error: Error, variables) => {
      setTestingKey(null);
      console.error(`Erro ao testar chave ${variables.provider}:`, error.message);
    }
  });

  const handleSave = () => {
    saveConfigMutation.mutate(formData as any);
  };

  const handleTestKey = (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      console.warn("Digite uma chave de API para testar");
      return;
    }
    setTestingKey(provider);
    testApiKeyMutation.mutate({ provider, apiKey });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/ia')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-purple-600" />
              Configurações da Prof. Ana
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure as integrações e comportamento da assistente IA educacional
            </p>
          </div>
        </div>
        <Badge variant={formData.isActive ? "default" : "secondary"} className="text-sm">
          {formData.isActive ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Status da Prof. Ana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="active-switch">Assistente ativa</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar a Prof. Ana completamente
              </p>
            </div>
            <Switch
              id="active-switch"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateFormData('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chaves de API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves de API
          </CardTitle>
          <CardDescription>
            Configure as chaves de acesso para os serviços de IA externa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={formData.openaiApiKey}
                onChange={(e) => updateFormData('openaiApiKey', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestKey('openai', formData.openaiApiKey || '')}
                disabled={testApiKeyMutation.isPending && testingKey === 'openai'}
              >
                <TestTube className="h-4 w-4" />
                {testApiKeyMutation.isPending && testingKey === 'openai' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
          </div>

          {/* Perplexity */}
          <div className="space-y-2">
            <Label htmlFor="perplexity-key">Perplexity API Key</Label>
            <div className="flex gap-2">
              <Input
                id="perplexity-key"
                type="password"
                placeholder="pplx-..."
                value={formData.perplexityApiKey}
                onChange={(e) => updateFormData('perplexityApiKey', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestKey('perplexity', formData.perplexityApiKey || '')}
                disabled={testApiKeyMutation.isPending && testingKey === 'perplexity'}
              >
                <TestTube className="h-4 w-4" />
                {testApiKeyMutation.isPending && testingKey === 'perplexity' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
          </div>

          {/* ElevenLabs */}
          <div className="space-y-2">
            <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
            <div className="flex gap-2">
              <Input
                id="elevenlabs-key"
                type="password"
                placeholder="el_..."
                value={formData.elevenlabsApiKey}
                onChange={(e) => updateFormData('elevenlabsApiKey', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestKey('elevenlabs', formData.elevenlabsApiKey || '')}
                disabled={testApiKeyMutation.isPending && testingKey === 'elevenlabs'}
              >
                <TestTube className="h-4 w-4" />
                {testApiKeyMutation.isPending && testingKey === 'elevenlabs' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <div className="flex gap-2">
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                value={formData.anthropicApiKey}
                onChange={(e) => updateFormData('anthropicApiKey', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestKey('anthropic', formData.anthropicApiKey || '')}
                disabled={testApiKeyMutation.isPending && testingKey === 'anthropic'}
              >
                <TestTube className="h-4 w-4" />
                {testApiKeyMutation.isPending && testingKey === 'anthropic' ? 'Testando...' : 'Testar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Funcionalidades Habilitadas
          </CardTitle>
          <CardDescription>
            Ative ou desative recursos específicos da Prof. Ana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Busca na Web</Label>
              <p className="text-sm text-muted-foreground">
                Permite à Prof. Ana buscar informações atualizadas na internet
              </p>
            </div>
            <Switch
              checked={formData.enabledFeatures?.webSearch}
              onCheckedChange={(checked) => updateNestedField('enabledFeatures', 'webSearch', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Síntese de Voz</Label>
              <p className="text-sm text-muted-foreground">
                Permite à Prof. Ana responder com áudio sintetizado
              </p>
            </div>
            <Switch
              checked={formData.enabledFeatures?.voiceSynthesis}
              onCheckedChange={(checked) => updateNestedField('enabledFeatures', 'voiceSynthesis', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Análise de Imagens</Label>
              <p className="text-sm text-muted-foreground">
                Permite à Prof. Ana analisar e descrever imagens enviadas
              </p>
            </div>
            <Switch
              checked={formData.enabledFeatures?.imageAnalysis}
              onCheckedChange={(checked) => updateNestedField('enabledFeatures', 'imageAnalysis', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Memória Contextual</Label>
              <p className="text-sm text-muted-foreground">
                Permite à Prof. Ana lembrar do contexto das conversas
              </p>
            </div>
            <Switch
              checked={formData.enabledFeatures?.contextualMemory}
              onCheckedChange={(checked) => updateNestedField('enabledFeatures', 'contextualMemory', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Resposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Resposta
          </CardTitle>
          <CardDescription>
            Ajuste o comportamento das respostas da Prof. Ana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Máximo de Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={formData.responseSettings?.maxTokens}
                onChange={(e) => updateNestedField('responseSettings', 'maxTokens', parseInt(e.target.value))}
                min={100}
                max={4000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Criatividade (Temperature)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.responseSettings?.temperature}
                onChange={(e) => updateNestedField('responseSettings', 'temperature', parseFloat(e.target.value))}
                min={0}
                max={1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modelo de IA</Label>
            <select
              id="model"
              value={formData.responseSettings?.model}
              onChange={(e) => updateNestedField('responseSettings', 'model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saveConfigMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}