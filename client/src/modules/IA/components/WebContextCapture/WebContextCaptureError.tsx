import { AlertCircle } from 'lucide-react';
import React from 'react';

interface WebContextCaptureErrorProps {
  message: string;
}

export function WebContextCaptureError({ message }: WebContextCaptureErrorProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <span className="text-sm text-red-800">{message}</span>
    </div>
  );
} 