import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Label } from '../../../shared/ui/label';
import { Switch } from '../../../shared/ui/switch';
import { Globe, Mic, Image, Brain } from 'lucide-react';
import React from 'react';

interface ConfigFeaturesCardProps {
  enabledFeatures: {
    webSearch: boolean;
    voiceSynthesis: boolean;
    imageAnalysis: boolean;
    contextualMemory: boolean;
  };
  onFeatureToggle: (feature: string, enabled: boolean) => void;
}

type Feature = {
  id: keyof ConfigFeaturesCardProps['enabledFeatures'];
  label: string;
  description: string;
  icon: React.ElementType;
};

export function ConfigFeaturesCard({ enabledFeatures, onFeatureToggle }: ConfigFeaturesCardProps) {
  const features: Feature[] = [
    {
      id: 'webSearch',
      label: 'Busca na Web',
      description: 'Permite que a assistente busque informações atualizadas na internet',
      icon: Globe
    },
    {
      id: 'voiceSynthesis',
      label: 'Síntese de Voz',
      description: 'Habilita a conversão de texto em fala para respostas',
      icon: Mic
    },
    {
      id: 'imageAnalysis',
      label: 'Análise de Imagens',
      description: 'Permite que a assistente analise e descreva imagens',
      icon: Image
    },
    {
      id: 'contextualMemory',
      label: 'Memória Contextual',
      description: 'Mantém o contexto da conversa entre mensagens',
      icon: Brain
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recursos Habilitados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {features.map((feature) => (
          <div key={feature.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <feature.icon className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor={`feature-${feature.id}`}>{feature.label}</Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            <Switch
              id={`feature-${feature.id}`}
              checked={enabledFeatures[feature.id]}
              onCheckedChange={(checked) => onFeatureToggle(feature.id, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 