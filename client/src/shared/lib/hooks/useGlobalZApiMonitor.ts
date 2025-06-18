import { useEffect, useRef } from 'react';
import { useZApiStore } from '@/shared/store/zapiStore';

export function useGlobalZApiMonitor() {
  const { 
    isConfigured, 
    status,
    connectionMonitorActive,
    startConnectionMonitor, 
    stopConnectionMonitor, 
    restoreConnection
  } = useZApiStore();
  
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      // Restaurar conexão existente ao inicializar a aplicação
      restoreConnection();
    }

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