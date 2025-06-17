import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { WebContextCaptureForm } from './WebContextCaptureForm';
import { WebContextCaptureResult } from './WebContextCaptureResult';
import { WebContextCaptureError } from './WebContextCaptureError';
import { WebContextCaptureSuccess } from './WebContextCaptureSuccess';
import { WebContextCaptureProps, WebCaptureResult } from './types';

export function WebContextCapture({ onContextAdded }: WebContextCaptureProps) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [captureResult, setCaptureResult] = useState<WebCaptureResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [editableSummary, setEditableSummary] = useState('');

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
      setEditableSummary(data.summary);
      setIsCapturing(false);
    },
    onError: () => {
      setIsCapturing(false);
    }
  });

  const saveContextMutation = useMutation({
    mutationFn: async () => {
      if (!captureResult || !category) {
        throw new Error('Dados incompletos para salvar contexto');
      }
      const contextData = {
        title: customTitle || captureResult.title,
        content: `URL: ${captureResult.url}\n\nConteúdo:\n${captureResult.content}\n\nResumo:\n${editableSummary}`,
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
      setUrl('');
      setCategory('');
      setCustomTitle('');
      setEditableSummary('');
      setCaptureResult(null);
      onContextAdded?.();
    }
  });

  const handleCaptureUrl = () => {
    if (!url.trim()) return;
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
        <CardTitle className="flex items-center gap-2">Capturar Contexto de Site</CardTitle>
        <CardDescription>
          Adicione conhecimento de qualquer site para a Prof. Ana usar nas respostas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WebContextCaptureForm
          url={url}
          setUrl={setUrl}
          isCapturing={isCapturing}
          captureResult={captureResult}
          onCapture={handleCaptureUrl}
        />
        {isCapturing && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm text-blue-800">Analisando conteúdo do site com IA...</span>
          </div>
        )}
        {captureWebContentMutation.isError && (
          <WebContextCaptureError message={captureWebContentMutation.error?.message || 'Erro ao capturar site'} />
        )}
        {captureResult && (
          <WebContextCaptureResult
            captureResult={captureResult}
            customTitle={customTitle}
            setCustomTitle={setCustomTitle}
            category={category}
            setCategory={setCategory}
            editableSummary={editableSummary}
            setEditableSummary={setEditableSummary}
            onSave={handleSaveContext}
            onNew={() => {
              setCaptureResult(null);
              setUrl('');
              setCustomTitle('');
              setEditableSummary('');
              setCategory('');
            }}
            savePending={saveContextMutation.isPending}
          />
        )}
        {saveContextMutation.isSuccess && <WebContextCaptureSuccess />}
        {saveContextMutation.isError && (
          <WebContextCaptureError message={saveContextMutation.error?.message || 'Erro ao salvar contexto'} />
        )}
      </CardContent>
    </Card>
  );
} 