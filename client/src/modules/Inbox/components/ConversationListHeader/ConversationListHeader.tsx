import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Search, Filter, X, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface ConversationListHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  channels: any[];
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

  // Buscar equipes para os filtros
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Erro ao carregar equipes");
      return response.json();
    },
  });

  // Buscar agentes/usuários para os filtros
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/system-users"],
    queryFn: async () => {
      const response = await fetch("/api/system-users");
      if (!response.ok) throw new Error("Erro ao carregar agentes");
      return response.json();
    },
  });

  // Sincronizar com prop externa apenas na inicialização
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value);
    
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Definir novo timeout para debounce
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 500); // Aumentei para 500ms para reduzir ainda mais as requisições
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

          {/* Filtros avançados */}
          <div className="border-t border-gray-200 pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros Avançados</h4>
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
                        {agent.displayName || agent.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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

export default ConversationListHeader;