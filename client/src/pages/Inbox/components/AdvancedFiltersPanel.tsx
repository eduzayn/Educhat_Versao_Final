import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ChevronDown, ChevronUp, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdvancedFiltersPanelProps {
  userFilter: string;
  teamFilter: string;
  periodFilter: string;
  customDateFrom?: Date;
  customDateTo?: Date;
  onUserFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onPeriodFilterChange: (value: string) => void;
  onCustomDateChange: (from?: Date, to?: Date) => void;
  teams: any[];
  users: any[];
}

export function AdvancedFiltersPanel({
  userFilter,
  teamFilter,
  periodFilter,
  customDateFrom,
  customDateTo,
  onUserFilterChange,
  onTeamFilterChange,
  onPeriodFilterChange,
  onCustomDateChange,
  teams,
  users
}: AdvancedFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Contar filtros ativos
  const activeFiltersCount = [
    userFilter !== 'all',
    teamFilter !== 'all',
    periodFilter !== 'all',
    customDateFrom || customDateTo
  ].filter(Boolean).length;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    onUserFilterChange('all');
    onTeamFilterChange('all');
    onPeriodFilterChange('all');
    onCustomDateChange(undefined, undefined);
  };

  // Obter cores das equipes baseado no teamType
  const getTeamBadgeColor = (teamType: string) => {
    const colorMap: { [key: string]: string } = {
      'comercial': 'bg-blue-100 text-blue-700',
      'suporte': 'bg-pink-100 text-pink-700',
      'cobranca': 'bg-orange-100 text-orange-700',
      'secretaria': 'bg-purple-100 text-purple-700',
      'tutoria': 'bg-green-100 text-green-700',
      'financeiro': 'bg-yellow-100 text-yellow-700'
    };
    return colorMap[teamType] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="px-4 py-2 border-b border-gray-100 bg-white">
      {/* Botão de toggle dos filtros avançados */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-600 hover:text-gray-900"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="w-3 h-3 mr-1" />
          Filtros avançados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={clearAllFilters}
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Painel expansível */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filtro por usuário atribuído */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              👤 Usuário atribuído
            </label>
            <Select value={userFilter} onValueChange={onUserFilterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="unassigned">Sem atribuição</SelectItem>
                {users.filter(u => u.isActive).map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.displayName || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por equipe */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              🏷️ Equipe
            </label>
            <Select value={teamFilter} onValueChange={onTeamFilterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                <SelectItem value="unassigned">Sem equipe</SelectItem>
                {teams.filter(t => t.isActive).map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getTeamBadgeColor(team.teamType)}`}></div>
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por período */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              📅 Período
            </label>
            <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seletor de data personalizado */}
        {periodFilter === 'custom' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {customDateFrom ? (
                      customDateTo ? (
                        <>
                          {format(customDateFrom, "dd/MM/yy", { locale: ptBR })} -{' '}
                          {format(customDateTo, "dd/MM/yy", { locale: ptBR })}
                        </>
                      ) : (
                        format(customDateFrom, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateFrom}
                    selected={{
                      from: customDateFrom,
                      to: customDateTo,
                    }}
                    onSelect={(range) => {
                      onCustomDateChange(range?.from, range?.to);
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {(customDateFrom || customDateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onCustomDateChange(undefined, undefined)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}