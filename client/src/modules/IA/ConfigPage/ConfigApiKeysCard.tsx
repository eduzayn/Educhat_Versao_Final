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
    const keyName = e.target.id.replace('-key', 'ApiKey');
    onApiKeyChange(keyName, e.target.value);
  };

  const handleFocus = (keyName: string) => {
    setEditingKeys(prev => ({ ...prev, [keyName]: true }));
    // Quando o usuário foca no campo, automaticamente torna visível
    setVisibleKeys(prev => ({ ...prev, [keyName]: true }));
  };

  const handleBlur = (keyName: string) => {
    setEditingKeys(prev => ({ ...prev, [keyName]: false }));
    // Não ocultar automaticamente ao perder foco se o usuário escolheu manter visível
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
              type={visibleKeys['openai'] ? "text" : "password"}
              value={visibleKeys['openai'] || editingKeys['openai'] ? formData.openaiApiKey : maskApiKey(formData.openaiApiKey)}
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
              type={visibleKeys['perplexity'] ? "text" : "password"}
              value={visibleKeys['perplexity'] || editingKeys['perplexity'] ? formData.perplexityApiKey : maskApiKey(formData.perplexityApiKey)}
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
              type={visibleKeys['elevenlabs'] ? "text" : "password"}
              value={visibleKeys['elevenlabs'] || editingKeys['elevenlabs'] ? formData.elevenlabsApiKey : maskApiKey(formData.elevenlabsApiKey)}
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
              type={visibleKeys['anthropic'] ? "text" : "password"}
              value={visibleKeys['anthropic'] || editingKeys['anthropic'] ? formData.anthropicApiKey : maskApiKey(formData.anthropicApiKey)}
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