import { MessageSquare, Brain } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import type { AILog } from './types';

interface LogItemProps {
  log: AILog;
}

export function LogItem({ log }: LogItemProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Interação #{log.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {log.processingTime && (
            <Badge variant="outline" className="text-xs">
              {log.processingTime}ms
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Mensagem do Usuário</span>
          </div>
          <p className="text-sm text-blue-900">{log.message}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-800">Resposta da Prof. Ana</span>
          </div>
          <p className="text-sm text-purple-900">{log.response}</p>
        </div>

        {log.classification && (
          <div className="grid gap-2 md:grid-cols-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intenção:</span>
              <Badge variant="outline" className="text-xs">
                {log.classification.intent}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentimento:</span>
              <Badge 
                variant={
                  log.classification.sentiment === 'positive' ? 'default' :
                  log.classification.sentiment === 'negative' ? 'destructive' : 'secondary'
                }
                className="text-xs"
              >
                {log.classification.sentiment}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confiança:</span>
              <Badge variant="outline" className="text-xs">
                {log.classification.confidence}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modo IA:</span>
              <Badge variant="outline" className="text-xs">
                {log.classification.aiMode}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 