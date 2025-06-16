import { CheckCircle } from 'lucide-react';
import React from 'react';

export function WebContextCaptureSuccess() {
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span className="text-sm text-green-800">
        Contexto web salvo com sucesso! A Prof. Ana já pode usar este conhecimento.
      </span>
    </div>
  );
} 