import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/ui/alert';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useZApiStore } from '@/shared/store/zapiStore';

interface ZApiQRCodeProps {
  baseUrl: string;
  instanceId: string;
  token: string;
  clientToken: string;
  onConnectionSuccess?: () => void;
}

interface ZApiStatus {
  connected: boolean;
  session: boolean;
  smartphoneConnected: boolean;
}

export function ZApiQRCode({ baseUrl, instanceId, token, clientToken, onConnectionSuccess }: ZApiQRCodeProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Usar a store global para persistir o status
  const { 
    status, 
    setStatus, 
    startConnectionMonitor, 
    stopConnectionMonitor, 
    setConfigured,
    isConfigured 
  } = useZApiStore();

  // As credenciais agora são gerenciadas pelo backend

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/zapi/qr-code');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resposta da Z-API QR Code:', data);
      
      if (data.value) {
        // O endpoint qr-code-bytes retorna a imagem base64 real
        const imageData = `data:image/png;base64,${data.value}`;
        console.log('Imagem processada:', imageData.substring(0, 100) + '...');
        setQrCodeImage(imageData);
        // Começar a verificar o status globalmente
        startConnectionMonitor();
      } else {
        throw new Error('QR Code não encontrado na resposta da API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter QR Code');
    } finally {
      setLoading(false);
    }
  };

  // Observar mudanças no status apenas para notificar sucesso
  useEffect(() => {
    if (status?.connected && status?.session) {
      console.log('✅ WhatsApp conectado com sucesso!');
      onConnectionSuccess?.();
      setQrCodeImage(null); // Limpar QR Code quando conectado
    }
  }, [status?.connected, status?.session, onConnectionSuccess]);

  // Cleanup do monitoramento quando componente for desmontado
  useEffect(() => {
    return () => {
      // Não parar o monitoramento global aqui, apenas limpar estados locais
      setQrCodeImage(null);
      setError(null);
    };
  }, []);

  const getStatusDisplay = () => {
    if (!status) return null;

    if (status.connected && status.session && status.smartphoneConnected) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            WhatsApp conectado com sucesso!
          </AlertDescription>
        </Alert>
      );
    }

    if (status.connected || status.session) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
          <AlertDescription className="text-yellow-800">
            Aguardando conexão com o smartphone...
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Instância não conectada
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Conectar WhatsApp
          {checkingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusDisplay()}

        {!qrCodeImage && !loading && (
          <Button 
            onClick={fetchQRCode} 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar QR Code
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2">Gerando QR Code...</span>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {qrCodeImage && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src={qrCodeImage} 
                alt="QR Code WhatsApp" 
                className="border-2 border-gray-200 rounded-lg"
                style={{ maxWidth: '256px', maxHeight: '256px' }}
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Escaneie este QR Code com o WhatsApp do seu celular
              </p>
              <p className="text-xs text-gray-500">
                WhatsApp → Dispositivos vinculados → Vincular dispositivo
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchQRCode}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar QR Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}