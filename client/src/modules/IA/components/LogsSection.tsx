import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Badge } from '../../../shared/ui/badge';
import { MessageSquare, Trash2, Activity, Brain } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface AILog {
  id: number;
  message: string;
  classification: {
    intent: string;
    sentiment: string;
    confidence: number;
    aiMode: string;
  };
  response: string;
  processingTime: number;
  createdAt: string;
}

interface LogsSectionProps {
  logs: AILog[] | undefined;
  logsLoading: boolean;
}

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
            {logs && logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                disabled={clearLogsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Logs
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Interação #{log.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.processingTime}ms
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                Os logs de atividade aparecerão aqui após as primeiras interações
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}