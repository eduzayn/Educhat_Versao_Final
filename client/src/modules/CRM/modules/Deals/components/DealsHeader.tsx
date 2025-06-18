import React from "react";
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Filter, Search, Kanban, List, Plus, Calendar, ChevronDown } from "lucide-react";
import type { Deal } from '@shared/schema';

interface DealsHeaderProps {
  selectedFunnelId: string;
  setSelectedFunnelId: (funnelId: string) => void;
  funnelsData: any[];
  getFunnelIcon: (team: string) => React.ReactNode;
  search: string;
  setSearch: (value: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  isNewDealDialogOpen: boolean;
  setIsNewDealDialogOpen: (open: boolean) => void;
  openNewDealDialog: () => void;
  handleNewDealSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  selectedStageForNewDeal: string | null;
  currentTeam: any;
  createDealMutation: { isPending: boolean };
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  customDateStart: string;
  setCustomDateStart: (date: string) => void;
  customDateEnd: string;
  setCustomDateEnd: (date: string) => void;
}

export const DealsHeader: React.FC<DealsHeaderProps> = ({
  selectedFunnelId,
  setSelectedFunnelId,
  funnelsData,
  getFunnelIcon,
  search,
  setSearch,
  viewMode,
  setViewMode,
  isNewDealDialogOpen,
  setIsNewDealDialogOpen,
  openNewDealDialog,
  handleNewDealSubmit,
  selectedStageForNewDeal,
  currentTeam,
  createDealMutation,
  dateFilter,
  setDateFilter,
  customDateStart,
  setCustomDateStart,
  customDateEnd,
  setCustomDateEnd
}) => (
  <div className="flex items-center gap-4 flex-wrap">
    <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {funnelsData?.map((funnel: any) => (
          <SelectItem key={funnel.id} value={funnel.id}>
            <div className="flex items-center gap-2">
              <span className="text-base">{getFunnelIcon(funnel.teamType)}</span>
              <span>{funnel.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar negócios..."
        className="pl-9 w-80"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> 
          Filtros
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem 
          onClick={() => setDateFilter('all')}
          className={dateFilter === 'all' ? 'bg-accent' : ''}
        >
          Todos os períodos
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('today')}
          className={dateFilter === 'today' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Hoje
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('week')}
          className={dateFilter === 'week' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Esta semana
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('15days')}
          className={dateFilter === '15days' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Últimos 15 dias
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('30days')}
          className={dateFilter === '30days' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Últimos 30 dias
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('month')}
          className={dateFilter === 'month' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Este mês
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('quarter')}
          className={dateFilter === 'quarter' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Este trimestre
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('year')}
          className={dateFilter === 'year' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Este ano
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDateFilter('custom')}
          className={dateFilter === 'custom' ? 'bg-accent' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Data personalizada
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {dateFilter === 'custom' && (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {customDateStart && customDateEnd 
              ? `${customDateStart} - ${customDateEnd}`
              : 'Selecionar período'
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Data inicial</Label>
              <Input
                id="dateStart"
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Data final</Label>
              <Input
                id="dateEnd"
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
              />
            </div>
            {customDateStart && customDateEnd && (
              <div className="text-sm text-muted-foreground">
                Período: {customDateStart} até {customDateEnd}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )}

    <div className="flex items-center border rounded-md">
      <Button
        variant={viewMode === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('kanban')}
        className="rounded-r-none"
      >
        <Kanban className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('table')}
        className="rounded-l-none"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>

    <Dialog open={isNewDealDialogOpen} onOpenChange={setIsNewDealDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={openNewDealDialog}>
          <Plus className="h-4 w-4 mr-2" /> Novo Negócio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleNewDealSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Negócio</Label>
            <Input
              name="name"
              placeholder="Ex: Curso de Programação - João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="company">Empresa/Cliente</Label>
            <Input
              name="company"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              name="value"
              type="number"
              step="0.01"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="probability">Probabilidade (%)</Label>
            <Input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue="50"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              name="description"
              placeholder="Detalhes sobre o negócio..."
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            O negócio será criado no estágio: {
              selectedStageForNewDeal 
                ? currentTeam?.stages?.find((s: any) => s.id === selectedStageForNewDeal)?.name
                : currentTeam?.stages?.[0]?.name
            } ({currentTeam?.name || 'Funil'})
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewDealDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDealMutation.isPending}>
              {createDealMutation.isPending ? 'Criando...' : 'Criar Negócio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
); 