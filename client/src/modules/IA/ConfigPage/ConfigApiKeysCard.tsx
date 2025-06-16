import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Key } from 'lucide-react';
import React, { ChangeEvent } from 'react';

interface ConfigApiKeysCardProps {
  formData: {
    openaiApiKey: string;
    perplexityApiKey: string;
    elevenlabsApiKey: string;
    anthropicApiKey: string;
  };
  onApiKeyChange: (key: string, value: string) => void;
}

export function ConfigApiKeysCard({ formData, onApiKeyChange }: ConfigApiKeysCardProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(e.target.id.replace('-key', 'ApiKey'), e.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chaves de API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            value={formData.openaiApiKey}
            onChange={handleChange}
            placeholder="sk-..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perplexity-key">Perplexity API Key</Label>
          <Input
            id="perplexity-key"
            type="password"
            value={formData.perplexityApiKey}
            onChange={handleChange}
            placeholder="pplx-..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
          <Input
            id="elevenlabs-key"
            type="password"
            value={formData.elevenlabsApiKey}
            onChange={handleChange}
            placeholder="xi-api-..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anthropic-key">Anthropic API Key</Label>
          <Input
            id="anthropic-key"
            type="password"
            value={formData.anthropicApiKey}
            onChange={handleChange}
            placeholder="sk-ant-..."
          />
        </div>
      </CardContent>
    </Card>
  );
} 