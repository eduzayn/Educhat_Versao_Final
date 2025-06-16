import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { Loader2, Plus, CheckCircle } from 'lucide-react';
import { CONTEXT_CATEGORIES, WebCaptureResult } from './types';
import React from 'react';

interface WebContextCaptureResultProps {
  captureResult: WebCaptureResult;
  customTitle: string;
  setCustomTitle: (title: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  onSave: () => void;
  onNew: () => void;
  savePending: boolean;
}

export function WebContextCaptureResult({
  captureResult,
  customTitle,
  setCustomTitle,
  category,
  setCategory,
  onSave,
  onNew,
  savePending
}: WebContextCaptureResultProps) {
  return (
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
            onClick={onSave}
            disabled={!category || savePending}
            className="flex-1"
          >
            {savePending ? (
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
            onClick={onNew}
          >
            Novo
          </Button>
        </div>
      </div>
    </div>
  );
} 