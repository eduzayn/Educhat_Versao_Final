import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
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
  
  const { status } = useZApiStore();

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/zapi/qrcode', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.qrCode) {
        setQrCodeImage(data.qrCode);
      } else {
        throw new Error('QR Code não encontrado na resposta da API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter QR Code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status?.connected && status?.session) {
      if (onConnectionSuccess) {
        onConnectionSuccess();
      }
      setQrCodeImage(null);
    }
  }, [status?.connected, status?.session]);

  const getStatusDisplay = () => {
    if (!status) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Verificando status...</span>
        </div>
      );
    }

    if (status.connected && status.session) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>WhatsApp conectado com sucesso!</span>
        </div>
      );
    }

    if (status.connected && !status.session) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Aguardando escaneamento do QR Code...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span>Desconectado</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Conectar WhatsApp
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusDisplay()}

        {!qrCodeImage && !loading && (
          <Button onClick={fetchQRCode} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar QR Code
          </Button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchQRCode}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {qrCodeImage && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex justify-center">
              <img 
                src={qrCodeImage} 
                alt="QR Code WhatsApp"
                className="max-w-full h-auto max-h-64"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Escaneie este QR Code com seu WhatsApp para conectar
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchQRCode}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </Button>
            </div>
          </div>
        )}

        {status?.connected && status?.session && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm text-center">
              ✅ WhatsApp conectado com sucesso! Você pode fechar esta janela.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}