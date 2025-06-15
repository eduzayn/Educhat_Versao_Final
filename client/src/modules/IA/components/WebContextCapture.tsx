import { useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Textarea } from '../../../shared/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Badge } from '../../../shared/ui/badge';
import { Globe, Loader2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface WebContextCaptureProps {
  onContextAdded?: () => void;
}

interface WebCaptureResult {
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  url: string;
  metadata: {
    domain: string;
    wordCount: number;
    extractedAt: string;
  };
}

const CONTEXT_CATEGORIES = [
  'cursos',
  'suporte',
  'vendas',
  'institucional',
  'tecnico',
  'geral'
];

export function WebContextCapture({ onContextAdded }: WebContextCaptureProps) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [captureResult, setCaptureResult] = useState<WebCaptureResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureWebContentMutation = useMutation({
    mutationFn: async (webUrl: string) => {
      setIsCapturing(true);
      const response = await fetch('/api/web-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao capturar conteúdo do site');
      }
      
      return response.json();
    },
    onSuccess: (data: WebCaptureResult) => {
      setCaptureResult(data);
      setCustomTitle(data.title);
      setIsCapturing(false);
    },
    onError: (error: Error) => {
      setIsCapturing(false);
      console.error('Erro ao capturar site:', error);
    }
  });

  const saveContextMutation = useMutation({
    mutationFn: async () => {
      if (!captureResult || !category) {
        throw new Error('Dados incompletos para salvar contexto');
      }

      const contextData = {
        title: customTitle || captureResult.title,
        content: `URL: ${captureResult.url}\n\nConteúdo:\n${captureResult.content}\n\nResumo:\n${captureResult.summary}`,
        category,
        type: 'web_content',
        metadata: {
          ...captureResult.metadata,
          originalUrl: captureResult.url,
          keywords: captureResult.keywords
        }
      };

      const response = await fetch('/api/ia/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao salvar contexto');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/contexts'] });
      
      // Reset form
      setUrl('');
      setCategory('');
      setCustomTitle('');
      setCaptureResult(null);
      
      onContextAdded?.();
    }
  });

  const handleCaptureUrl = () => {
    if (!url.trim()) return;
    
    // Ensure URL has protocol
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    captureWebContentMutation.mutate(processedUrl);
  };

  const handleSaveContext = () => {
    if (!captureResult || !category) return;
    saveContextMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Capturar Contexto de Site
        </CardTitle>
        <CardDescription>
          Adicione conhecimento de qualquer site para a Prof. Ana usar nas respostas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Site</label>
          <div className="flex gap-2">
            <Input
              placeholder="https://exemplo.com ou exemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCapturing || !!captureResult}
            />
            <Button
              onClick={handleCaptureUrl}
              disabled={!url.trim() || isCapturing || !!captureResult}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Capturar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Capture Progress */}
        {isCapturing && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">
              Analisando conteúdo do site com IA...
            </span>
          </div>
        )}

        {/* Capture Error */}
        {captureWebContentMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              {captureWebContentMutation.error?.message || 'Erro ao capturar site'}
            </span>
          </div>
        )}

        {/* Capture Result */}
        {captureResult && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Conteúdo capturado com sucesso!</span>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Título Personalizado</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Digite um título personalizado..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEXT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Informações Capturadas</label>
                <div className="space-y-2 text-sm">
                  <div><strong>Domínio:</strong> {captureResult.metadata.domain}</div>
                  <div><strong>Palavras:</strong> {captureResult.metadata.wordCount.toLocaleString()}</div>
                  <div><strong>URL:</strong> <a href={captureResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{captureResult.url}</a></div>
                </div>
              </div>

              {captureResult.keywords.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Palavras-chave Extraídas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {captureResult.keywords.slice(0, 10).map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Resumo do Conteúdo</label>
                <Textarea
                  value={captureResult.summary}
                  readOnly
                  className="text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveContext}
                  disabled={!category || saveContextMutation.isPending}
                  className="flex-1"
                >
                  {saveContextMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Contexto
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setCaptureResult(null);
                    setUrl('');
                    setCustomTitle('');
                    setCategory('');
                  }}
                >
                  Novo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save Success */}
        {saveContextMutation.isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Contexto web salvo com sucesso! A Prof. Ana já pode usar este conhecimento.
            </span>
          </div>
        )}

        {/* Save Error */}
        {saveContextMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              {saveContextMutation.error?.message || 'Erro ao salvar contexto'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}