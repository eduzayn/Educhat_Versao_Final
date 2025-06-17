import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Key, Eye, EyeOff } from 'lucide-react';
import React, { ChangeEvent, useState } from 'react';

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
  const [visibleKeys, setVisibleKeys] = useState<{[key: string]: boolean}>({});
  const [editingKeys, setEditingKeys] = useState<{[key: string]: boolean}>({});
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(e.target.id.replace('-key', 'ApiKey'), e.target.value);
  };

  const handleFocus = (keyName: string) => {
    setEditingKeys(prev => ({ ...prev, [keyName]: true }));
  };

  const handleBlur = (keyName: string) => {
    setEditingKeys(prev => ({ ...prev, [keyName]: false }));
  };

  const toggleKeyVisibility = (keyName: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getDisplayValue = (key: string, keyName: string) => {
    if (editingKeys[keyName] || visibleKeys[keyName] || !key) return key;
    return maskApiKey(key);
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
          <div className="relative">
            <Input
              id="openai-key"
              type="text"
              value={getDisplayValue(formData.openaiApiKey, 'openai')}
              onChange={handleChange}
              onFocus={() => handleFocus('openai')}
              onBlur={() => handleBlur('openai')}
              placeholder="sk-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => toggleKeyVisibility('openai')}
            >
              {visibleKeys['openai'] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="perplexity-key">Perplexity API Key</Label>
          <div className="relative">
            <Input
              id="perplexity-key"
              type="text"
              value={getDisplayValue(formData.perplexityApiKey, 'perplexity')}
              onChange={handleChange}
              onFocus={() => handleFocus('perplexity')}
              onBlur={() => handleBlur('perplexity')}
              placeholder="pplx-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => toggleKeyVisibility('perplexity')}
            >
              {visibleKeys['perplexity'] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
          <div className="relative">
            <Input
              id="elevenlabs-key"
              type="text"
              value={getDisplayValue(formData.elevenlabsApiKey, 'elevenlabs')}
              onChange={handleChange}
              onFocus={() => handleFocus('elevenlabs')}
              onBlur={() => handleBlur('elevenlabs')}
              placeholder="xi-api-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => toggleKeyVisibility('elevenlabs')}
            >
              {visibleKeys['elevenlabs'] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anthropic-key">Anthropic API Key</Label>
          <div className="relative">
            <Input
              id="anthropic-key"
              type="text"
              value={getDisplayValue(formData.anthropicApiKey, 'anthropic')}
              onChange={handleChange}
              onFocus={() => handleFocus('anthropic')}
              onBlur={() => handleBlur('anthropic')}
              placeholder="sk-ant-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => toggleKeyVisibility('anthropic')}
            >
              {visibleKeys['anthropic'] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 