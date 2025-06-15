import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Filter, Search } from 'lucide-react';
import React from 'react';

interface ActivityFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({ search, setSearch, typeFilter, setTypeFilter, statusFilter, setStatusFilter }) => (
  <div className="flex gap-4 flex-wrap">
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar atividades..."
        className="pl-9 w-80"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
    <Select value={typeFilter} onValueChange={setTypeFilter}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Tipo de atividade" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os tipos</SelectItem>
        <SelectItem value="call">Ligações</SelectItem>
        <SelectItem value="meeting">Reuniões</SelectItem>
        <SelectItem value="email">E-mails</SelectItem>
        <SelectItem value="task">Tarefas</SelectItem>
        <SelectItem value="message">Mensagens</SelectItem>
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os status</SelectItem>
        <SelectItem value="completed">Concluídas</SelectItem>
        <SelectItem value="scheduled">Agendadas</SelectItem>
        <SelectItem value="pending">Pendentes</SelectItem>
        <SelectItem value="cancelled">Canceladas</SelectItem>
      </SelectContent>
    </Select>
    <Button variant="outline">
      <Filter className="h-4 w-4 mr-2" /> Mais Filtros
    </Button>
  </div>
); 