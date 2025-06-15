import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="p-6 text-center text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
      <p className="text-sm">Carregando mensagens...</p>
    </div>
  );
}