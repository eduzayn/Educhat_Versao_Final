import { Card } from '../../../shared/ui/card';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { LogsSectionProps } from './types';
import { LogsHeader } from './LogsHeader';
import { LogsContent } from './LogsContent';

export function LogsSection({ logs, logsLoading }: LogsSectionProps) {
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ia/logs', { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao limpar logs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    }
  });

  const handleClearLogs = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      clearLogsMutation.mutate();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <LogsHeader 
          hasLogs={!!logs && logs.length > 0}
          onClearLogs={handleClearLogs}
          isClearing={clearLogsMutation.isPending}
        />
        <LogsContent logs={logs} logsLoading={logsLoading} />
      </Card>
    </div>
  );
}