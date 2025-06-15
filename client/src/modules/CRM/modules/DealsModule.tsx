import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import type { Deal } from '@shared/schema';
import { teamConfigs } from '@/lib/crmFunnels';
import {
  Search,
  Filter,
  Columns,
  List,
  Plus,
  Building2,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash,
  Kanban,
  ArrowLeft
} from "lucide-react";

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedTeam, setSelectedTeam] = useState("comercial");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Estado para modal de novo negócio
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<string | null>(null);
  
  // Estado para modal de edição de negócio
  const [isEditDealDialogOpen, setIsEditDealDialogOpen] = useState(false);
  const [selectedDealForEdit, setSelectedDealForEdit] = useState<any | null>(null);

  // State para paginação
  const [page, setPage] = useState(1);
  const limit = 50;

  // Estados para drag and drop nativo
  const [draggedDeal, setDraggedDeal] = useState<any>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Mapeamento de ícones para cada tipo de funil
  const getFunnelIcon = (team: string) => {
    const icons: Record<string, string> = {
      comercial: '💼',
      tutoria: '🎓',
      secretaria: '📋',
      financeiro: '💰',
      suporte: '🛠️',
      marketing: '📈'
    };
    return icons[team] || '📁';
  };

  // Configuração atual do team
  const currentTeam = teamConfigs[selectedTeam];

  // Query para buscar funis
  const { data: funnelsData } = useQuery({
    queryKey: ['/api/funnels'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para buscar negócios
  const { data: dealsData, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['/api/deals', { page, limit, team: selectedTeam, search }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/deals?page=${page}&limit=${limit}&team=${selectedTeam}&search=${encodeURIComponent(search)}`);
      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para atualizar deal
  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      const response = await apiRequest('PATCH', `/api/deals/${dealId}`, { stage });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    }
  });

  // Mutation para criar deal
  const createDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      const response = await apiRequest('POST', '/api/deals', dealData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      setIsNewDealDialogOpen(false);
    }
  });

  const deals = dealsData?.deals || [];

  // Função para obter deals de um estágio específico
  const getDealsForStage = (stageId: string) => {
    return deals.filter((deal: any) => deal.stage === stageId);
  };

  // Função para calcular valor total de um estágio
  const calculateStageValue = (stageDeals: any[]) => {
    return stageDeals.reduce((total, deal) => total + (deal.value || 0), 0);
  };

  // Função para abrir modal de novo negócio
  const openNewDealDialog = (stageId?: string) => {
    setSelectedStageForNewDeal(stageId || null);
    setIsNewDealDialogOpen(true);
  };

  // Função para lidar com o envio do formulário de novo negócio
  const handleNewDealSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dealData = {
      name: formData.get('name'),
      company: formData.get('company'),
      value: parseFloat(formData.get('value') as string) || 0,
      stage: selectedStageForNewDeal || currentTeam?.stages?.[0]?.id,
      teamType: selectedTeam,
      probability: parseInt(formData.get('probability') as string) || 50,
      description: formData.get('description'),
      owner: 'Admin',
      tags: []
    };

    createDealMutation.mutate(dealData);
  };

  // Handlers para drag and drop nativo
  const handleDragStart = (e: React.DragEvent, deal: any) => {
    setDraggedDeal(deal);
    e.dataTransfer.setData('text/plain', deal.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    updateDealMutation.mutate({
      dealId: draggedDeal.id,
      stage: newStage
    });
    
    setDraggedDeal(null);
  };

  // Função para abrir modal de edição
  const handleEditDeal = (deal: any) => {
    setSelectedDealForEdit(deal);
    setIsEditDealDialogOpen(true);
  };

  // Função para atualizar negócio completo
  const updateFullDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      return apiRequest('PATCH', `/api/deals/${dealData.id}`, dealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      setIsEditDealDialogOpen(false);
      setSelectedDealForEdit(null);
      toast({
        title: "Sucesso",
        description: "Negócio atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar negócio. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/crm')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao CRM
        </Button>
        <div className="text-sm text-muted-foreground">
          / Negócios
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border flex-1 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Negócios</h1>
              <p className="text-muted-foreground">
                Gerencie seus negócios por funil de vendas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getFunnelIcon(selectedTeam)}</span>
              <div>
                <div className="font-medium">{currentTeam?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {deals.length} negócios
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {funnelsData?.map((funnel: any) => (
                  <SelectItem key={funnel.id} value={funnel.teamType}>
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
                <Button onClick={() => openNewDealDialog()}>
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
                        ? currentTeam?.stages?.find(s => s.id === selectedStageForNewDeal)?.name
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
        </div>

        <div className="overflow-hidden flex-1">
          {viewMode === 'kanban' ? (
            <div className="h-full p-6">
              <div className="flex gap-4 h-full overflow-x-auto pb-4">
                {(currentTeam?.stages || []).map((stage: any) => {
                  const stageDeals = getDealsForStage(stage.id);
                  return (
                    <div 
                      key={stage.id} 
                      className={`min-w-72 max-w-80 flex-1 rounded-lg p-4 flex flex-col transition-colors ${
                        dragOverStage === stage.id ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/30'
                      }`}
                      onDragOver={(e) => handleDragOver(e, stage.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stage.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <h3 className="font-medium">{stage.name}</h3>
                          <Badge variant="secondary">{stageDeals.length}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          R$ {calculateStageValue(stageDeals).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto min-h-[400px] max-h-[calc(100vh-300px)] pr-2">
                        {stageDeals.map((deal) => (
                          <Card
                            key={deal.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, deal)}
                            className="bg-white shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-95"
                          >
                            <CardContent className="p-2.5 space-y-1.5">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium leading-tight line-clamp-2">{deal.name}</p>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 -mt-0.5">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                                      Editar negócio
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{deal.company}</span>
                              </div>
                              <p className="text-sm text-green-600 font-semibold">
                                R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs py-0 px-1.5">
                                  {deal.probability}%
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate max-w-[60px]">{deal.owner}</span>
                              </div>
                              {deal.tags && deal.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 max-h-6 overflow-hidden">
                                  {deal.tags.slice(0, 2).map((tag: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs py-0 px-1">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {deal.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs py-0 px-1">
                                      +{deal.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center text-muted-foreground py-8">
                Visualização em tabela em desenvolvimento
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição de Negócio */}
      <Dialog open={isEditDealDialogOpen} onOpenChange={setIsEditDealDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Negócio</DialogTitle>
          </DialogHeader>
          {selectedDealForEdit && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const dealData = {
                id: selectedDealForEdit.id,
                name: formData.get('name'),
                company: formData.get('company'),
                value: parseFloat(formData.get('value') as string),
                probability: parseInt(formData.get('probability') as string),
                description: formData.get('description'),
                team: selectedDealForEdit.team,
                stage: selectedDealForEdit.stage
              };
              updateFullDealMutation.mutate(dealData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Negócio</Label>
                <Input
                  name="name"
                  defaultValue={selectedDealForEdit.name}
                  placeholder="Ex: Curso de Programação - João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-company">Empresa/Cliente</Label>
                <Input
                  name="company"
                  defaultValue={selectedDealForEdit.company}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-value">Valor (R$)</Label>
                <Input
                  name="value"
                  type="number"
                  step="0.01"
                  defaultValue={selectedDealForEdit.value}
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-probability">Probabilidade (%)</Label>
                <Input
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={selectedDealForEdit.probability}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  name="description"
                  defaultValue={selectedDealForEdit.description || ''}
                  placeholder="Detalhes sobre o negócio..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDealDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateFullDealMutation.isPending}>
                  {updateFullDealMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}