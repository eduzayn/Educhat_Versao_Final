import { useEffect } from 'react';
import { useZApiStore } from '@/shared/store/zapiStore';

export function useGlobalZApiMonitor() {
  const { 
    isConfigured, 
    connectionMonitorActive, 
    startConnectionMonitor, 
    stopConnectionMonitor 
  } = useZApiStore();

  useEffect(() => {
    // Se estiver configurado e não houver monitoramento ativo, iniciar
    if (isConfigured && !connectionMonitorActive) {
      startConnectionMonitor();
    }

    // Cleanup apenas quando não há mais componentes usando
    return () => {
      // Não parar o monitoramento aqui para manter persistência global
    };
  }, [isConfigured, connectionMonitorActive, startConnectionMonitor]);

  // Retornar uma função para parar manualmente se necessário
  return {
    stopMonitoring: stopConnectionMonitor
  };
}