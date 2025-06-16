import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Label } from '../../../shared/ui/label';
import { Input } from '../../../shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Slider } from '../../../shared/ui/slider';
import { MessageSquare } from 'lucide-react';
import React, { ChangeEvent } from 'react';

interface ConfigResponseSettingsCardProps {
  responseSettings: {
    maxTokens: number;
    temperature: number;
    model: string;
  };
  onSettingChange: (setting: string, value: string | number) => void;
}

type Model = {
  id: string;
  label: string;
};

export function ConfigResponseSettingsCard({ responseSettings, onSettingChange }: ConfigResponseSettingsCardProps) {
  const models: Model[] = [
    { id: 'gpt-4', label: 'GPT-4' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { id: 'claude-3-opus', label: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ];

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>, setting: string) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : parseInt(e.target.value);
    onSettingChange(setting, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Configurações de Resposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="model-select">Modelo de IA</Label>
          <Select
            value={responseSettings.model}
            onValueChange={(value: string) => onSettingChange('model', value)}
          >
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-tokens">Máximo de Tokens</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="max-tokens"
              min={100}
              max={4000}
              step={100}
              value={[responseSettings.maxTokens]}
              onValueChange={([value]) => onSettingChange('maxTokens', value)}
              className="flex-1"
            />
            <Input
              type="number"
              value={responseSettings.maxTokens}
              onChange={(e) => handleNumberChange(e, 'maxTokens')}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperatura</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[responseSettings.temperature]}
              onValueChange={([value]) => onSettingChange('temperature', value)}
              className="flex-1"
            />
            <Input
              type="number"
              value={responseSettings.temperature}
              onChange={(e) => handleNumberChange(e, 'temperature')}
              className="w-24"
              step={0.1}
              min={0}
              max={1}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Valores mais altos tornam as respostas mais criativas, valores mais baixos as tornam mais precisas
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 