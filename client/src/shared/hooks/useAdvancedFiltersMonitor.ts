import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FilterMonitorState {
  teams: any[];
  agents: any[];
  isTeamsLoading: boolean;
  isAgentsLoading: boolean;
  teamsError: boolean;
  agentsError: boolean;
  hasTeamsData: boolean;
  hasAgentsData: boolean;
  isReady: boolean;
  forceReady: boolean;
  retryCount: number;
  lastUpdate: number;
}

export function useAdvancedFiltersMonitor() {
  const [forceReady, setForceReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const monitorRef = useRef<NodeJS.Timeout>();
  const lastStateRef = useRef<FilterMonitorState | null>(null);

  // Query para equipes com monitoramento avançado
  const teamsQuery = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams", {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Request-ID': `teams-${Date.now()}-${Math.random()}`
        }
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const teams = Array.isArray(data) ? data : [];
      
      console.log(`📊 [MONITOR] Teams carregadas: ${teams.length} itens`);
      return teams;
    },
    retry: (failureCount, error) => {
      console.warn(`⚠️ [MONITOR] Tentativa ${failureCount + 1} para teams:`, error);
      return failureCount < 5;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000,
    gcTime: 60000,
  });

  // Query para agentes com monitoramento avançado
  const agentsQuery = useQuery({
    queryKey: ["/api/system-users"],
    queryFn: async () => {
      const response = await fetch("/api/system-users", {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Request-ID': `agents-${Date.now()}-${Math.random()}`
        }
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const agents = Array.isArray(data) ? data : [];
      
      console.log(`👤 [MONITOR] Agentes carregados: ${agents.length} itens`);
      return agents;
    },
    retry: (failureCount, error) => {
      console.warn(`⚠️ [MONITOR] Tentativa ${failureCount + 1} para agentes:`, error);
      return failureCount < 5;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000,
    gcTime: 60000,
  });

  // Estado atual computado
  const currentState: FilterMonitorState = {
    teams: teamsQuery.data || [],
    agents: agentsQuery.data || [],
    isTeamsLoading: teamsQuery.isLoading,
    isAgentsLoading: agentsQuery.isLoading,
    teamsError: !!teamsQuery.error,
    agentsError: !!agentsQuery.error,
    hasTeamsData: (teamsQuery.data?.length || 0) > 0,
    hasAgentsData: (agentsQuery.data?.length || 0) > 0,
    isReady: (!teamsQuery.isLoading && !agentsQuery.isLoading) || forceReady,
    forceReady,
    retryCount,
    lastUpdate: Date.now()
  };

  // Monitoramento contínuo de inconsistências
  useEffect(() => {
    const checkInconsistencies = () => {
      const now = Date.now();
      const debugEnabled = localStorage.getItem('educhat_debug_filters') === 'true';
      
      // Log periódico do estado (apenas em debug)
      if (debugEnabled) {
        console.log('🔍 [MONITOR] Estado atual:', {
          timestamp: new Date().toISOString(),
          teams: currentState.teams.length,
          agents: currentState.agents.length,
          loading: currentState.isTeamsLoading || currentState.isAgentsLoading,
          ready: currentState.isReady,
          hasData: currentState.hasTeamsData || currentState.hasAgentsData,
          forced: currentState.forceReady
        });
      }

      // Detectar situações problemáticas
      const isProblematic = 
        !currentState.isTeamsLoading && 
        !currentState.isAgentsLoading && 
        !currentState.isReady && 
        (currentState.hasTeamsData || currentState.hasAgentsData);

      if (isProblematic) {
        console.warn('🚨 [MONITOR] Inconsistência detectada! Dados disponíveis mas filtros não prontos');
        
        // Auto-correção após 3 segundos
        setTimeout(() => {
          if (!currentState.isReady && (currentState.hasTeamsData || currentState.hasAgentsData)) {
            console.log('🔧 [MONITOR] Auto-correção: forçando estado pronto');
            setForceReady(true);
          }
        }, 3000);
      }

      // Detectar falhas prolongadas de carregamento
      if ((currentState.isTeamsLoading || currentState.isAgentsLoading) && retryCount === 0) {
        setRetryCount(1);
        // Timeout para carregamento prolongado
        setTimeout(() => {
          if (currentState.isTeamsLoading || currentState.isAgentsLoading) {
            console.warn('⏰ [MONITOR] Carregamento prolongado detectado, tentando refetch');
            teamsQuery.refetch();
            agentsQuery.refetch();
            setRetryCount(prev => prev + 1);
          }
        }, 10000);
      }

      lastStateRef.current = currentState;
    };

    // Executar check imediatamente
    checkInconsistencies();

    // Configurar monitoramento periódico
    monitorRef.current = setInterval(checkInconsistencies, 5000);

    return () => {
      if (monitorRef.current) {
        clearInterval(monitorRef.current);
      }
    };
  }, [currentState.isTeamsLoading, currentState.isAgentsLoading, currentState.isReady, 
      currentState.hasTeamsData, currentState.hasAgentsData, retryCount]);

  // Reset do force quando dados chegam naturalmente
  useEffect(() => {
    if (forceReady && !currentState.isTeamsLoading && !currentState.isAgentsLoading) {
      const timer = setTimeout(() => {
        console.log('✅ [MONITOR] Reset do force - dados carregados naturalmente');
        setForceReady(false);
        setRetryCount(0);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [forceReady, currentState.isTeamsLoading, currentState.isAgentsLoading]);

  // Funções de controle manual
  const manualRefresh = () => {
    console.log('🔄 [MONITOR] Refresh manual iniciado');
    setForceReady(false);
    setRetryCount(0);
    teamsQuery.refetch();
    agentsQuery.refetch();
  };

  const forceShow = () => {
    console.log('🔧 [MONITOR] Forçando exibição manual');
    setForceReady(true);
  };

  return {
    // Dados
    teams: currentState.teams,
    agents: currentState.agents,
    
    // Estados
    isLoading: currentState.isTeamsLoading || currentState.isAgentsLoading,
    isReady: currentState.isReady,
    hasError: currentState.teamsError || currentState.agentsError,
    hasData: currentState.hasTeamsData || currentState.hasAgentsData,
    
    // Controles
    manualRefresh,
    forceShow,
    isForced: forceReady,
    retryCount,
    
    // Queries originais para compatibilidade
    teamsQuery,
    agentsQuery,
    
    // Estado completo para debug
    debugState: currentState
  };
}