import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Search, Filter, X, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { Link } from 'wouter';

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
  onRefresh?: () => void;
  onNewContact?: () => void;
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
  onRefresh,
  onNewContact
}: ConversationListHeaderProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce da busca para melhor performance
  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearchTerm(value);
    const timeoutId = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setSearchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setChannelFilter('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || channelFilter !== 'all';

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Header principal */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
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
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="p-2 hover:bg-gray-100"
              aria-label="Atualizar conversas"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
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
            value={debouncedSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 border-gray-300 focus:ring-2 focus:ring-educhat-primary focus:border-transparent"
            aria-label="Campo de busca de conversas"
          />
          {debouncedSearchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDebouncedSearchTerm('');
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
        <div className="px-4 pb-4 space-y-3 bg-gray-50 border-t border-gray-100">
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