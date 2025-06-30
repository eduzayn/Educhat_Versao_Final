import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { useUserTags } from '@/hooks/useUserTags';

interface AdvancedFiltersPanelProps {
  userFilter: string;
  teamFilter: string;
  periodFilter: string;
  tagFilter: string;
  customDateFrom?: Date;
  customDateTo?: Date;
  onUserFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onPeriodFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onCustomDateChange: (from?: Date, to?: Date) => void;
  teams: any[];
  users: any[];
}

export function AdvancedFiltersPanel({
  userFilter,
  teamFilter,
  periodFilter,
  tagFilter,
  customDateFrom,
  customDateTo,
  onUserFilterChange,
  onTeamFilterChange,
  onPeriodFilterChange,
  onTagFilterChange,
  onCustomDateChange,
  teams,
  users
}: AdvancedFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Buscar tags disponíveis
  const { data: userTags = [] } = useUserTags();
  const tagsArray = Array.isArray(userTags) ? userTags : [];

  // Contar filtros ativos
  const activeFiltersCount = [
    userFilter !== 'all',
    teamFilter !== 'all',
    periodFilter !== 'all',
    tagFilter !== 'all',
    customDateFrom || customDateTo
  ].filter(Boolean).length;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    onUserFilterChange('all');
    onTeamFilterChange('all');
    onPeriodFilterChange('all');
    onTagFilterChange('all');
    onCustomDateChange(undefined, undefined);
  };

  // Formatar data para input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Converter string para Date
  const parseInputDate = (dateString: string) => {
    return dateString ? new Date(dateString + 'T00:00:00') : undefined;
  };

  return (
    <div className="px-4 py-2 border-b border-gray-100 bg-white">
      {/* Botão de toggle dos filtros avançados */}
      <div className="flex items-center justify-between">
        <button
          className="h-8 text-xs text-black hover:text-gray-900 flex items-center bg-transparent border-none cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <Filter className="w-3 h-3 mr-1 text-black" />
          Filtros avançados
          {activeFiltersCount > 0 && (
            <span className="ml-2 h-5 px-1.5 text-xs bg-gray-100 text-gray-700 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 flex items-center bg-transparent border-none cursor-pointer"
            onClick={clearAllFilters}
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </button>
        )}
      </div>

      {/* Painel expansível */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Filtro por usuário atribuído */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              👤 Usuário
            </label>
            <select
              value={userFilter}
              onChange={(e) => onUserFilterChange(e.target.value)}
              className="w-full h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
            >
              <option value="all">Todos os usuários</option>
              <option value="unassigned">Sem atribuição</option>
              {(users || []).filter(u => u.isActive).map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.displayName || user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por equipe */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              🏷️ Equipe
            </label>
            <select
              value={teamFilter}
              onChange={(e) => onTeamFilterChange(e.target.value)}
              className="w-full h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
            >
              <option value="all">Todas as equipes</option>
              <option value="unassigned">Sem equipe</option>
              {(teams || []).filter(t => t.isActive).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(team => (
                <option key={team.id} value={team.id.toString()}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tags */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              🏷️ Tags
            </label>
            <select
              value={tagFilter}
              onChange={(e) => onTagFilterChange(e.target.value)}
              className="w-full h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
            >
              <option value="all">Todas as tags</option>
              {tagsArray.map((tag: any) => (
                <option key={tag.id} value={tag.id.toString()}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

        </div>


      </div>
    </div>
  );
}