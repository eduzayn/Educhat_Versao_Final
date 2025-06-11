import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
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

  // State para paginação
  const [page, setPage] = useState(1);
  const limit = 50;

  // Mapeamento de ícones para cada tipo de funil
  const getFunnelIcon = (team: string) => {
    const iconMap = {
      'comercial': '🏢',
      'suporte': '🛠️',
      'financeiro': '💳',
      'secretaria': '📋',
      'tutoria': '🎓',
      'cobranca': '💰',
      'secretaria_pos': '🎓',
      'analise_certificacao': '🔍',
      'documentacao': '📄',
      'geral': '⚙️',
      'teste_automacao': '🧪'
    };
    return iconMap[team as keyof typeof iconMap] || '📊';
  };

  // Fetch all available funnels
  const { data: funnelsData } = useQuery({
    queryKey: ['/api/funnels'],
    queryFn: async () => {
      const response = await fetch('/api/funnels');
      if (!response.ok) throw new Error('Falha ao carregar funis');
      return response.json();
    }
  });

  // Fetch deals from database with pagination and filtering
  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['/api/deals', selectedTeam, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        team: selectedTeam
      });
      
      const response = await fetch(`/api/deals?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar negócios');
      return response.json();
    },
    enabled: !!selectedTeam // Só busca se equipe estiver selecionada
  });

  const rawDeals = dealsResponse?.deals || [];
  const totalPages = dealsResponse?.totalPages || 1;
  const currentPage = dealsResponse?.currentPage || 1;
  
  // Set default selected team when funnels are loaded
  useEffect(() => {
    if (funnelsData && funnelsData.length > 0 && !selectedTeam) {
      setSelectedTeam(funnelsData[0].teamType);
    }
  }, [funnelsData, selectedTeam]);

  // Get current team configuration
  const currentTeam = teamConfigs[selectedTeam as keyof typeof teamConfigs];
  
  // Reset page when team changes
  useEffect(() => {
    setPage(1);
  }, [selectedTeam]);

  // Transform deals (already filtered by backend)
  const deals = rawDeals.map(deal => ({
      ...deal,
      id: deal.id.toString(),
      stage: deal.stage,
      tags: deal.tags ? (Array.isArray(deal.tags) ? deal.tags : (typeof deal.tags === 'string' ? JSON.parse(deal.tags || '[]') : [])) : [],
      closeDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
      company: 'Empresa não definida',
      owner: deal.owner || 'Sistema',
      ownerAvatar: '',
      value: deal.value || 0,
      probability: deal.probability || 0
    }));

  // Create new deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      return await apiRequest('POST', '/api/deals', dealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/deals', selectedTeam, page, limit] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/deals'] 
      });
      setIsNewDealDialogOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao criar novo negócio:', error);
    }
  });

  // Update deal stage mutation
  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      return await apiRequest('PATCH', `/api/deals/${dealId}`, { stage });
    },
    onMutate: async ({ dealId, stage }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/deals', selectedTeam, page, limit] });
      
      // Snapshot the previous value
      const previousDeals = queryClient.getQueryData(['/api/deals', selectedTeam, page, limit]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/deals', selectedTeam, page, limit], (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((deal: any) => 
            deal.id === dealId ? { ...deal, stage } : deal
          )
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDeals) {
        queryClient.setQueryData(['/api/deals', selectedTeam, page, limit], context.previousDeals);
      }
      console.error('Erro ao atualizar estágio do negócio:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: ['/api/deals', selectedTeam, page, limit] 
      });
    }
  });

  // Handle new deal form submission
  const handleNewDealSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dealData = {
      name: formData.get('name'),
      contactId: parseInt(formData.get('contactId') as string) || null,
      value: parseFloat(formData.get('value') as string) || 0,
      expectedCloseDate: formData.get('expectedCloseDate') || null,
      probability: parseInt(formData.get('probability') as string) || 0,
      description: formData.get('description') || '',
      stage: selectedStageForNewDeal || currentTeam.stages[0].id, // Usa estágio selecionado ou primeiro do funil
      teamType: selectedTeam
    };

    createDealMutation.mutate(dealData);
  };

  // Function to open modal for specific stage
  const openNewDealDialog = (stageId?: string) => {
    setSelectedStageForNewDeal(stageId || null);
    setIsNewDealDialogOpen(true);
  };

  const filtered = deals.filter((deal) =>
    deal.name.toLowerCase().includes(search.toLowerCase()) ||
    deal.company.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsForStage = (stageId: string) => filtered.filter(d => d.stage === stageId);

  const calculateStageValue = (deals: any[]) => deals.reduce((acc, deal) => acc + (deal.value || 0), 0);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const deal = deals.find(d => d.id === draggableId);
    if (!deal) return;

    // Update deal stage in database
    updateDealMutation.mutate({
      dealId: parseInt(draggableId),
      stage: destination.droppableId
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando negócios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Negócios</h2>
              <p className="text-muted-foreground">
                Gerencie seu pipeline de vendas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o funil">
                  {selectedTeam && funnelsData && (
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getFunnelIcon(selectedTeam)}</span>
                      <span>{funnelsData.find((f: any) => f.teamType === selectedTeam)?.name}</span>
                    </div>
                  )}
                </SelectValue>
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
                      placeholder="Ex: Venda de Curso de Marketing"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactId">ID do Contato (opcional)</Label>
                    <Input
                      name="contactId"
                      type="number"
                      placeholder="ID do contato relacionado"
                    />
                  </div>

                  <div>
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      name="value"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
                      placeholder="50"
                      defaultValue="50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedCloseDate">Data Prevista de Fechamento</Label>
                    <Input
                      name="expectedCloseDate"
                      type="date"
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
                        ? currentTeam.stages.find(s => s.id === selectedStageForNewDeal)?.name
                        : currentTeam.stages[0].name
                    } ({currentTeam.name})
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
      </div>

      <div className="overflow-hidden">
        {viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="h-full">
              <div className="flex gap-4 h-full overflow-x-auto pb-4 deals-kanban-container">
                {currentTeam.stages.map((stage: any) => {
                  const stageDeals = getDealsForStage(stage.id);
                  return (
                    <div key={stage.id} className="min-w-72 max-w-80 flex-1 bg-muted/30 rounded-lg p-4 flex flex-col deals-column">
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
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-3 flex-1 overflow-y-auto min-h-[400px] max-h-[calc(100vh-300px)] pr-2 deals-column-scroll ${
                              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-950' : ''
                            }`}
                          >
                            {stageDeals.map((deal, index) => (
                              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab ${
                                      snapshot.isDragging ? 'shadow-lg rotate-3 bg-blue-50' : ''
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <CardContent className="p-2.5 space-y-1.5">
                                      <div className="flex items-start justify-between">
                                        <p className="text-sm font-medium leading-tight line-clamp-2">{deal.name}</p>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 -mt-0.5">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
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
                                      {deal.tags.length > 0 && (
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
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <Button 
                        variant="ghost" 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={() => openNewDealDialog(stage.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Negócio
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </DragDropContext>
        ) : (
          <div className="p-6">
            <div className="rounded-md border">
              <div className="grid grid-cols-7 gap-4 p-4 bg-muted font-medium text-sm">
                <div>Nome</div>
                <div>Empresa</div>
                <div>Valor</div>
                <div>Estágio</div>
                <div>Probabilidade</div>
                <div>Responsável</div>
                <div>Ações</div>
              </div>
              {filtered.map((deal) => (
                <div key={deal.id} className="grid grid-cols-7 gap-4 p-4 border-t items-center">
                  <div className="font-medium">{deal.name}</div>
                  <div className="text-muted-foreground">{deal.company}</div>
                  <div className="font-bold text-green-600">
                    R$ {deal.value.toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {currentTeam.stages.find((s: any) => s.id === deal.stage)?.name}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">{deal.probability}%</Badge>
                  </div>
                  <div className="text-muted-foreground">{deal.owner}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles de Paginação - Sempre Visível */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white dark:bg-gray-800 sticky bottom-0">
          <div className="text-sm text-muted-foreground">
            {dealsResponse ? (
              `Página ${currentPage} de ${totalPages} (${dealsResponse.total} negócios)`
            ) : (
              'Carregando negócios...'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!dealsResponse || currentPage === 1}
            >
              ← Anterior
            </Button>
            <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
              {currentPage}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={!dealsResponse || currentPage === totalPages}
            >
              Próxima →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}