import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ZApiLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  operation: string;
  data: any;
  duration?: number;
  requestId?: string;
}

interface DiagnosticReport {
  period: string;
  totalOperations: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  successRate: string;
  avgResponseTime: string;
  commonErrors: Array<{ error: string; count: number }>;
  lastErrors: ZApiLogEntry[];
}

export function ZApiDiagnostic() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: diagnostic, isLoading, refetch } = useQuery({
    queryKey: ['zapi-diagnostic'],
    queryFn: async () => {
      const response = await fetch('/api/zapi/diagnostic');
      if (!response.ok) {
        throw new Error('Erro ao buscar diagnóstico Z-API');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: requestLogs } = useQuery({
    queryKey: ['zapi-request-logs', selectedRequestId],
    queryFn: async () => {
      if (!selectedRequestId) return null;
      const response = await fetch(`/api/zapi/logs/${selectedRequestId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar logs da requisição');
      }
      return response.json();
    },
    enabled: !!selectedRequestId,
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800';
      case 'INFO':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    return `${duration}ms`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando diagnóstico Z-API...
      </div>
    );
  }

  const report: DiagnosticReport = diagnostic?.report;
  const recentLogs: ZApiLogEntry[] = diagnostic?.recentLogs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Diagnóstico Z-API</h2>
          <p className="text-gray-600">Monitoramento detalhado de envio de mensagens</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Pausar' : 'Auto-refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{report?.successRate || '0%'}</div>
            <p className="text-xs text-gray-500">{report?.successCount || 0} sucessos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{report?.errorCount || 0}</div>
            <p className="text-xs text-gray-500">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.avgResponseTime || '0ms'}</div>
            <p className="text-xs text-gray-500">Resposta API</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Timeouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{report?.timeoutCount || 0}</div>
            <p className="text-xs text-gray-500">Últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Logs Recentes</TabsTrigger>
          <TabsTrigger value="errors">Erros Comuns</TabsTrigger>
          <TabsTrigger value="request">Detalhes da Requisição</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes (Últimos 20)</CardTitle>
              <CardDescription>
                Clique em uma entrada para ver os detalhes completos da requisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                        selectedRequestId === log.requestId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedRequestId(log.requestId || null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge className={getLevelColor(log.level)}>
                            {log.level}
                          </Badge>
                          <span className="font-medium">{log.operation}</span>
                          {log.requestId && (
                            <Badge variant="outline" className="text-xs">
                              {log.requestId.slice(-8)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          <span>{formatDuration(log.duration)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {JSON.stringify(log.data).slice(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Mais Comuns</CardTitle>
              <CardDescription>
                Erros que ocorreram com mais frequência nas últimas 24h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report?.commonErrors?.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{error.error}</p>
                    </div>
                    <Badge variant="destructive">{error.count} ocorrências</Badge>
                  </div>
                )) || <p className="text-gray-500">Nenhum erro comum identificado</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Requisição</CardTitle>
              <CardDescription>
                {selectedRequestId 
                  ? `Mostrando logs para requisição ${selectedRequestId}`
                  : 'Selecione uma requisição nos logs para ver os detalhes'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestLogs?.logs ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {requestLogs.logs.map((log: ZApiLogEntry, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getLevelIcon(log.level)}
                            <Badge className={getLevelColor(log.level)}>
                              {log.level}
                            </Badge>
                            <span className="font-medium">{log.operation}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTimestamp(log.timestamp)} | {formatDuration(log.duration)}
                          </div>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Selecione uma requisição nos logs para ver os detalhes
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}