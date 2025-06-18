import { useEffect } from 'react';
import { useZApiStore } from '@/shared/store/zapiStore';

export function useZApiPersistence() {
  const { 
    status, 
    isConfigured, 
    connectionMonitorActive,
    restoreConnection,
    startConnectionMonitor 
  } = useZApiStore();

  useEffect(() => {
    // Garantir que a conexão seja restaurada quando o componente é montado
    const initializeConnection = async () => {
      if (!isConfigured || !status) {
        await restoreConnection();
      }
      
      // Se está configurado mas o monitor não está ativo, iniciar
      if (isConfigured && !connectionMonitorActive) {
        startConnectionMonitor();
      }
    };

    initializeConnection();
  // Remover dependências que causam loop - usar apenas na montagem inicial
  }, []);

  // Retornar o estado atual para uso nos componentes
  return {
    status,
    isConfigured,
    connectionMonitorActive
  };
}