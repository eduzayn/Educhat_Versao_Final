import React from "react";
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Filter, Search, Kanban, List, Plus } from "lucide-react";
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
  createDealMutation
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

    <Button variant="outline">
      <Filter className="h-4 w-4 mr-2" /> Filtros
    </Button>

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