import { useEffect } from 'react';
import { useZApiStore } from '@/shared/store/zapiStore';

export function useGlobalZApiMonitor() {
  const { 
    isConfigured, 
    status,
    connectionMonitorActive,
    startConnectionMonitor, 
    stopConnectionMonitor, 
    restoreConnection,
    checkConnection,
    setConfigured
  } = useZApiStore();

  useEffect(() => {
    // Verificar imediatamente se há uma conexão ativa no servidor
    const initializeConnection = async () => {
      try {
        // Verificar status atual no servidor
        await checkConnection();
        
        // Se o servidor retorna connected=true mas não temos configuração local, corrigir
        const currentState = useZApiStore.getState();
        if (currentState.status?.connected && !currentState.isConfigured) {
          setConfigured(true);
        }
        
        // Restaurar conexão se necessário
        if (!connectionMonitorActive) {
          await restoreConnection();
        }
      } catch (error) {
        console.log('Verificação inicial Z-API:', error);
      }
    };

    initializeConnection();

    // Limpar monitoramento ao desmontar
    return () => {
      stopConnectionMonitor();
    };
  }, []);

  useEffect(() => {
    if (isConfigured && !connectionMonitorActive) {
      startConnectionMonitor();
    } else if (!isConfigured && connectionMonitorActive) {
      stopConnectionMonitor();
    }
  }, [isConfigured, connectionMonitorActive, startConnectionMonitor, stopConnectionMonitor]);

  return {
    isConfigured,
    status
  };
}