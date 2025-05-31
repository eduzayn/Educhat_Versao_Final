import { useEffect } from 'react';
import { useZApiStore } from '@/shared/store/zapiStore';

export function useGlobalZApiMonitor() {
  const { 
    isConfigured, 
    startConnectionMonitor, 
    stopConnectionMonitor, 
    restoreConnection 
  } = useZApiStore();

  useEffect(() => {
    // Restaurar conexão existente ao inicializar a aplicação
    restoreConnection();

    // Limpar monitoramento ao desmontar
    return () => {
      stopConnectionMonitor();
    };
  }, [restoreConnection, stopConnectionMonitor]);

  useEffect(() => {
    if (isConfigured) {
      startConnectionMonitor();
    } else {
      stopConnectionMonitor();
    }
  }, [isConfigured, startConnectionMonitor, stopConnectionMonitor]);

  return {
    isConfigured
  };
}