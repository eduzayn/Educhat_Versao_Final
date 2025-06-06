import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/ui/alert';
import { useInternalChatStore } from '../store/internalChatStore';

export function ConnectionStatus() {
  const { isConnected, setConnected } = useInternalChatStore();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Simular verificação de conexão Socket.IO
    const checkConnection = () => {
      // Aqui seria verificado o estado real do Socket.IO
      // Por enquanto, simular conexão estável
      setConnected(true);
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, [setConnected]);

  useEffect(() => {
    if (!isConnected) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowAlert(false);
    }
  }, [isConnected]);

  if (!showAlert && isConnected) {
    return null;
  }

  return (
    <div className="p-2">
      <Alert variant={isConnected ? "default" : "destructive"} className="py-2">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="text-sm">
            {isConnected 
              ? 'Conectado ao chat interno' 
              : 'Conexão perdida. Tentando reconectar...'
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}