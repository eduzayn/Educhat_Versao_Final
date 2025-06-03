import { Badge } from '@/shared/ui/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface ZApiStatusIndicatorProps {
  isConnected?: boolean;
  className?: string;
}

export const ZApiStatusIndicator = ({ isConnected = false, className }: ZApiStatusIndicatorProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <Badge variant="default" className="bg-green-100 text-green-800">
            WhatsApp Conectado
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <Badge variant="destructive">
            WhatsApp Desconectado
          </Badge>
        </>
      )}
    </div>
  );
};