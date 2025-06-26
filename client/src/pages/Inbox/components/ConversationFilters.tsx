import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Calendar, User, Users, MessageSquare, Search, Check, UserCheck, Download } from 'lucide-react';
import { useState } from 'react';

interface ConversationFiltersProps {
  channelFilter: string;
  userFilter: string;
  teamFilter: string;
  periodFilter: string;
  onChannelFilterChange: (value: string) => void;
  onUserFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onPeriodFilterChange: (value: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  channels: any[];
  users: any[];
  teams: any[];
}

export function ConversationFilters({
  channelFilter,
  userFilter,
  teamFilter,
  periodFilter,
  onChannelFilterChange,
  onUserFilterChange,
  onTeamFilterChange,
  onPeriodFilterChange,
  onDateRangeChange,
  searchTerm,
  onSearchChange,
  channels,
  users,
  teams
}: ConversationFiltersProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const handleDateRangeChange = () => {
    if (onDateRangeChange && startDate && endDate) {
      onDateRangeChange(startDate, endDate);
    }
  };

  const handleAssignmentChange = (value: string) => {
    setAssignmentFilter(value);
    // Mapear para os filtros existentes
    switch (value) {
      case 'mine':
        // Para implementar: precisaríamos do ID do usuário atual
        break;
      case 'unassigned':
        onUserFilterChange('unassigned');
        break;
      case 'assigned':
        onUserFilterChange('all');
        break;
      default:
        onUserFilterChange('all');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100 space-y-3">
      {/* Primeira linha - Filtros principais em cascata */}
      <div className="space-y-3">
        {/* Período Personalizado */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 min-w-[80px]">Período:</span>
          <div className="flex gap-2 flex-1">
            <Input
              type="date"
              placeholder="De"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Input
              type="date"
              placeholder="Até"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleDateRangeChange}
              className="h-8 px-3 text-xs"
              disabled={!startDate || !endDate}
            >
              Aplicar
            </Button>
          </div>
        </div>

        {/* Atribuição */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 min-w-[80px]">Atribuição:</span>
          <div className="flex gap-2 flex-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="assignment"
                value="all"
                checked={assignmentFilter === 'all'}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                className="w-3 h-3"
              />
              Todos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="assignment"
                value="mine"
                checked={assignmentFilter === 'mine'}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                className="w-3 h-3"
              />
              Meus
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="assignment"
                value="unassigned"
                checked={assignmentFilter === 'unassigned'}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                className="w-3 h-3"
              />
              Não atribuídos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="assignment"
                value="assigned"
                checked={assignmentFilter === 'assigned'}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                className="w-3 h-3"
              />
              Atribuídos
            </label>
          </div>
        </div>

        {/* Equipe */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 min-w-[80px]">Equipe:</span>
          <Select value={teamFilter} onValueChange={onTeamFilterChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Selecionar equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              <SelectItem value="unassigned">Sem equipe</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Canal */}
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 min-w-[80px]">Canal:</span>
          <Select value={channelFilter} onValueChange={onChannelFilterChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Selecionar canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp (Todos)</SelectItem>
              {channels.filter(c => c.type === 'whatsapp' && c.isActive).map(channel => (
                <SelectItem key={channel.id} value={`whatsapp-${channel.id}`}>
                  WhatsApp {channel.name}
                </SelectItem>
              ))}
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Responsável (para filtro específico por usuário) */}
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 min-w-[80px]">Responsável:</span>
          <Select value={userFilter} onValueChange={onUserFilterChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Selecionar responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="unassigned">Sem atribuição</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.displayName || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Segunda linha - Busca global e ações rápidas */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone, palavra-chave..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-8 text-xs"
          />
        </div>

        {/* Ações rápidas */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1"
          >
            <Check className="w-3 h-3" />
            Marcar como lida
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1"
          >
            <UserCheck className="w-3 h-3" />
            Atribuir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1"
          >
            <Download className="w-3 h-3" />
            Exportar
          </Button>
        </div>
      </div>
    </div>
  );
}