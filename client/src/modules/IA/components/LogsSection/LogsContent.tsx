import { Activity } from 'lucide-react';
import { CardContent } from '@/shared/ui/card';
import { LogItem } from './LogItem';
import type { AILog } from './types';

interface LogsContentProps {
  logs: AILog[] | undefined;
  logsLoading: boolean;
}

export function LogsContent({ logs, logsLoading }: LogsContentProps) {
  if (logsLoading) {
    return (
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </CardContent>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <CardContent>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhum log encontrado</h3>
          <p className="text-muted-foreground">
            Os logs de atividade aparecerão aqui após as primeiras interações
          </p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </div>
    </CardContent>
  );
} 