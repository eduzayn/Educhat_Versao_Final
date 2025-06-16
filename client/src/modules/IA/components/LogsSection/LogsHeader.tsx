import { Activity, Trash2 } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';

interface LogsHeaderProps {
  hasLogs: boolean;
  onClearLogs: () => void;
  isClearing: boolean;
}

export function LogsHeader({ hasLogs, onClearLogs, isClearing }: LogsHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs de Atividade da Prof. Ana
          </CardTitle>
          <CardDescription>
            Histórico detalhado de todas as interações da IA
          </CardDescription>
        </div>
        {hasLogs && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearLogs}
            disabled={isClearing}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Logs
          </Button>
        )}
      </div>
    </CardHeader>
  );
} 