import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Separator } from '@/shared/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface SessionStatus {
  connected: boolean;
  session: boolean;
  smartphoneConnected?: boolean;
  qrCode?: string;
  lastCheck: string;
  instanceStatus: 'active' | 'inactive' | 'error';
}

interface SessionResponse {
  success: boolean;
  status: SessionStatus;
  recommendations: string[];
  timestamp: string;
}

export function SessionMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const queryClient = useQueryClient();

  // Buscar status da sessão
  const { data: sessionData, isLoading, error } = useQuery<SessionResponse>({
    queryKey: ['/api/zapi/session-status'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Buscar QR Code
  const { data: qrData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['/api/zapi/qr-code'],
    enabled: qrCodeVisible,
    retry: 1
  });

  // Mutation para reiniciar sessão
  const restartSession = useMutation({
    mutationFn: () => apiRequest('/api/zapi/restart-session', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zapi/session-status'] });
    },
  });

  const status = sessionData?.status;
  const isSessionActive = status?.connected && status?.session;
  const needsQrCode = status?.connected && !status?.session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Sessão WhatsApp</h2>
          <p className="text-muted-foreground">Status da conexão Z-API e WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/zapi/session-status'] })}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Conexão Z-API */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Z-API Status</CardTitle>
            {status?.connected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status?.connected ? "default" : "destructive"}>
                {status?.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Instância: {status?.instanceStatus || 'Desconhecido'}
            </p>
          </CardContent>
        </Card>

        {/* Sessão WhatsApp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Session</CardTitle>
            {status?.session ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status?.session ? "default" : "secondary"}>
                {status?.session ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.smartphoneConnected ? 'Smartphone conectado' : 'Aguardando conexão'}
            </p>
          </CardContent>
        </Card>

        {/* Status Geral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            {isSessionActive ? (
              <Zap className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isSessionActive ? "default" : "destructive"}>
                {isSessionActive ? 'Operacional' : 'Requer Ação'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Última verificação: {status?.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {!isSessionActive && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ação Necessária:</strong> As mensagens não serão entregues enquanto a sessão WhatsApp não estiver ativa.
            {needsQrCode && ' Escaneie o QR Code para reconectar.'}
          </AlertDescription>
        </Alert>
      )}

      {isSessionActive && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema Operacional:</strong> WhatsApp conectado e pronto para enviar mensagens.
          </AlertDescription>
        </Alert>
      )}

      {/* Recomendações */}
      {sessionData?.recommendations && sessionData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
            <CardDescription>Ações sugeridas baseadas no status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sessionData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* QR Code */}
        {needsQrCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Reconectar WhatsApp
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code para conectar o WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setQrCodeVisible(!qrCodeVisible)}
                disabled={qrLoading}
                className="w-full"
              >
                {qrLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {qrCodeVisible ? 'Ocultar QR Code' : 'Mostrar QR Code'}
              </Button>
              
              {qrCodeVisible && (
                <div className="text-center space-y-4">
                  {qrError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Erro ao gerar QR Code. Verifique a conexão com a Z-API.
                      </p>
                    </div>
                  )}
                  
                  {qrData?.connected && qrData?.session && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        WhatsApp já está conectado e ativo!
                      </p>
                    </div>
                  )}
                  
                  {qrData?.qrCode && (
                    <>
                      <img 
                        src={`data:image/png;base64,${qrData.qrCode}`}
                        alt="QR Code WhatsApp"
                        className="mx-auto border rounded-lg"
                        style={{ maxWidth: '200px' }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Abra WhatsApp → Aparelhos conectados → Conectar aparelho
                      </p>
                    </>
                  )}
                  
                  {qrData?.message && !qrData?.qrCode && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {qrData.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reiniciar Instância */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Reiniciar Instância
            </CardTitle>
            <CardDescription>
              Reinicia a instância Z-API se houver problemas de conexão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => restartSession.mutate()}
              disabled={restartSession.isPending}
              variant="outline"
              className="w-full"
            >
              {restartSession.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {restartSession.isPending ? 'Reiniciando...' : 'Reiniciar Instância'}
            </Button>
            
            {restartSession.isSuccess && (
              <Alert className="mt-3 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Instância reiniciada. Aguarde 30-60 segundos e verifique o status.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm font-mono">
              <div>Connected: {String(status.connected)}</div>
              <div>Session: {String(status.session)}</div>
              <div>Smartphone: {String(status.smartphoneConnected)}</div>
              <div>Instance Status: {status.instanceStatus}</div>
              <div>Last Check: {status.lastCheck}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}