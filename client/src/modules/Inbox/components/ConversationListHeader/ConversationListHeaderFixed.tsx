import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Search, Filter, X, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { useAdvancedFiltersMonitor } from '@/shared/hooks/useAdvancedFiltersMonitor';

interface ConversationListHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  channels?: Array<{ id: number; name: string }>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onNewContact?: () => void;
  teamFilter?: string;
  setTeamFilter?: (team: string) => void;
  periodFilter?: string;
  setPeriodFilter?: (period: string) => void;
  agentFilter?: string;
  setAgentFilter?: (agent: string) => void;
}

export function ConversationListHeader({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  channels = [],
  showFilters,
  setShowFilters,
  onNewContact,
  teamFilter = 'all',
  setTeamFilter = () => {},
  periodFilter = 'all',
  setPeriodFilter = () => {},
  agentFilter = 'all',
  setAgentFilter = () => {}
}: ConversationListHeaderProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [debugMode, setDebugMode] = useState(false);

  // Hook de monitoramento robusto para filtros avançados
  const {
    teams,
    agents,
    isLoading,
    isReady,
    hasError,
    hasData,
    manualRefresh,
    forceShow,
    isForced,
    retryCount,
    debugState
  } = useAdvancedFiltersMonitor();

  // Estados computados para renderização dos filtros
  const shouldShowAdvancedFilters = isReady || (hasData && !isLoading);
  const shouldShowError = hasError && !hasData && !isLoading;
  const shouldShowLoading = isLoading && !hasData;

  // Logs de debug com monitoramento robusto
  useEffect(() => {
    if (debugMode || window.localStorage.getItem('educhat_debug_filters') === 'true') {
      console.log('🔍 [DEBUG] Estado dos Filtros Avançados:', {
        timestamp: new Date().toISOString(),
        showFilters,
        teamsCount: teams?.length || 0,
        agentsCount: agents?.length || 0,
        isLoading,
        isReady,
        hasError,
        hasData,
        isForced,
        retryCount,
        shouldShowAdvancedFilters,
        shouldShowError,
        shouldShowLoading
      });
    }
  }, [showFilters, teams, agents, isLoading, isReady, hasError, hasData, isForced, retryCount, debugMode,
      shouldShowAdvancedFilters, shouldShowError, shouldShowLoading]);

  // Sincronizar com prop externa apenas na inicialização
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, []);

  // Ativar modo debug com tecla especial (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const newDebugMode = !debugMode;
        setDebugMode(newDebugMode);
        window.localStorage.setItem('educhat_debug_filters', newDebugMode.toString());
        console.log(`🔍 [DEBUG] Modo debug ${newDebugMode ? 'ATIVADO' : 'DESATIVADO'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Verificar se debug já estava ativo
    if (window.localStorage.getItem('educhat_debug_filters') === 'true') {
      setDebugMode(true);
    }
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value);
    
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Definir novo timeout para debounce
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 500);
  }, [setSearchTerm]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearFilters = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setLocalSearchTerm('');
    setSearchTerm('');
    setStatusFilter('all');
    setChannelFilter('all');
    setTeamFilter('all');
    setPeriodFilter('all');
    setAgentFilter('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || channelFilter !== 'all' || 
    teamFilter !== 'all' || periodFilter !== 'all' || agentFilter !== 'all';

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Header principal */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100"
              aria-label="Voltar ao dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100"
            aria-label="Alternar filtros"
          >
            <Filter className="w-4 h-4" />
          </Button>

          {onNewContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewContact}
              className="p-2 hover:bg-gray-100"
              aria-label="Novo contato"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Barra de busca */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar conversas..."
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 border-gray-300 focus:ring-2 focus:ring-educhat-primary focus:border-transparent"
            aria-label="Campo de busca de conversas"
          />
          {localSearchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                }
                setLocalSearchTerm('');
                setSearchTerm('');
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="px-4 pb-4 space-y-4 bg-gray-50 border-t border-gray-100">
          {/* Filtros básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="closed">Fechada</SelectItem>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Canal
              </label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os canais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id.toString()}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros avançados - renderização robusta com fallbacks */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Filtros Avançados</h4>
              {debugMode && (
                <div className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
                  Debug: T:{teams.length} A:{agents.length} R:{isReady ? '✓' : '✗'} F:{isForced ? '✓' : '✗'}
                </div>
              )}
            </div>
            
            {shouldShowLoading ? (
              // Estado de carregamento
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
              </div>
            ) : shouldShowError ? (
              // Estado de erro com opções de recuperação
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  Não foi possível carregar os filtros avançados. Tente uma das opções abaixo:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={manualRefresh}
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    Recarregar filtros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceShow}
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    Forçar exibição
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    Recarregar página
                  </Button>
                </div>
              </div>
            ) : (
              // Filtros avançados normais - sempre exibir quando houver dados
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe
                  </label>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as equipes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as equipes</SelectItem>
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {debugMode && (
                    <div className="text-xs text-gray-500 mt-1">
                      {teams.length} equipes disponíveis
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="this_week">Esta semana</SelectItem>
                      <SelectItem value="last_week">Semana passada</SelectItem>
                      <SelectItem value="this_month">Este mês</SelectItem>
                      <SelectItem value="last_month">Mês passado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agente
                  </label>
                  <Select value={agentFilter} onValueChange={setAgentFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os agentes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os agentes</SelectItem>
                      {agents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.displayName || agent.username || agent.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {debugMode && (
                    <div className="text-xs text-gray-500 mt-1">
                      {agents.length} agentes disponíveis
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Indicador de modo debug */}
            {debugMode && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="font-medium text-blue-800 mb-1">
                  Modo Debug Ativo (Ctrl+Shift+D para desativar)
                </div>
                <div className="text-blue-700 space-y-1">
                  <div>Status: Loading={isLoading ? 'SIM' : 'NÃO'} | Ready={isReady ? 'SIM' : 'NÃO'}</div>
                  <div>Error={hasError ? 'SIM' : 'NÃO'} | Data={hasData ? 'SIM' : 'NÃO'} | Forced={isForced ? 'SIM' : 'NÃO'}</div>
                  <div>Teams={teams.length} | Agents={agents.length} | Retry={retryCount}</div>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}