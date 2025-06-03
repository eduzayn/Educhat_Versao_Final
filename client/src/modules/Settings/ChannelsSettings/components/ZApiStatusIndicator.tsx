import { useZApiStore } from '@/shared/store/zapiStore';
import { CheckCircle, XCircle, Clock, Wifi } from 'lucide-react';
import { Badge } from '@/shared/ui/ui/badge';

export function ZApiStatusIndicator() {
  const { status, isConfigured } = useZApiStore();

  if (!isConfigured) {
    return (
      <Badge variant="outline" className="text-gray-500">
        <XCircle className="w-3 h-3 mr-1" />
        Não configurado
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge variant="outline" className="text-gray-500">
        <Clock className="w-3 h-3 mr-1" />
        Verificando...
      </Badge>
    );
  }

  if (status.connected && status.session) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        WhatsApp Conectado
      </Badge>
    );
  }

  if (status.connected && !status.session && status.smartphoneConnected) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Conectado e Ativo
      </Badge>
    );
  }

  if (status.connected && !status.session) {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        <Wifi className="w-3 h-3 mr-1" />
        API Conectada
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <XCircle className="w-3 h-3 mr-1" />
      Desconectado
    </Badge>
  );
}