import { Input } from '../../../shared/ui/input';
import { Button } from '../../../shared/ui/button';
import { Loader2, Globe } from 'lucide-react';
import React from 'react';

interface WebContextCaptureFormProps {
  url: string;
  setUrl: (url: string) => void;
  isCapturing: boolean;
  captureResult: any;
  onCapture: () => void;
}

export function WebContextCaptureForm({ url, setUrl, isCapturing, captureResult, onCapture }: WebContextCaptureFormProps) {
  return (
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
          onClick={onCapture}
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
  );
} 