import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
// CORREÇÃO: Importar sistema dinâmico de funis
import { getAllCategories, getDynamicFunnelForTeamType, getCategoryInfo, getStagesForCategory } from '@/shared/lib/crmFunnels';
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

// CORREÇÃO: Configuração movida para crmFunnels.ts centralizado - removida duplicação

// Componente para coluna individual com scroll infinito vertical
interface KanbanColumnProps {
  stage: any;
  deals: any[];
  teamType: string;
  onDragEnd: (result: DropResult) => void;
  onNewDeal: (stageId: string) => void;
}

function KanbanColumn({ stage, deals: initialDeals, teamType, onNewDeal }: { stage: any; deals: any[]; teamType: string; onNewDeal: (stageId: string) => void }) {
  // Hook para scroll infinito específico desta coluna
  const {
    data: columnData,
    isLoading: isColumnLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['/api/deals', teamType, stage.id],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '10', // 10 negócios por vez
        teamType: teamType,
        stage: stage.id
      });
      
      const response = await fetch(`/api/deals?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar negócios da coluna');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!teamType && !!stage.id
  });

  // Consolidar dados de todas as páginas carregadas para esta coluna
  const columnDeals = columnData?.pages.flatMap(page => page.deals) || initialDeals;

  // Transform deals específicos desta coluna
  const transformedDeals = columnDeals.map((deal: any) => ({
    ...deal,
    id: deal.id.toString(),
    stage: deal.stage,
    tags: deal.tags ? (Array.isArray(deal.tags) ? deal.tags : (typeof deal.tags === 'string' ? JSON.parse(deal.tags || '[]') : [])) : [],
    company: 'Empresa não definida',
    owner: deal.owner || 'Sistema',
    value: deal.value || 0,
    probability: deal.probability || 0
  }));

  const calculateStageValue = (deals: any[]) => deals.reduce((acc: number, deal: any) => acc + (deal.value || 0), 0);

  // Callback para detectar scroll e carregar mais
  const scrollTriggerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    
    // Cleanup no retorno
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-w-72 max-w-80 flex-1 bg-muted/30 rounded-lg p-4 flex flex-col deals-column">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
          <h3 className="font-medium">{stage.name}</h3>
          <Badge variant="secondary">{transformedDeals.length}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          R$ {calculateStageValue(transformedDeals).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
      
      <Droppable droppableId={stage.id} type="DEAL">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 flex-1 overflow-y-auto min-h-[400px] max-h-[calc(100vh-300px)] pr-2 deals-column-scroll ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-950' : ''
            }`}
          >
            {transformedDeals.map((deal: any, index: number) => (
              <Draggable key={deal.id} draggableId={String(deal.id)} index={index}>
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
            
            {/* Scroll infinito: elemento trigger */}
            {hasNextPage && (
              <div 
                ref={scrollTriggerRef}
                className="h-10 w-full flex items-center justify-center"
              >
                {isFetchingNextPage && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </div>
            )}
            
            {/* Status da coluna */}
            {!isColumnLoading && !hasNextPage && transformedDeals.length > 10 && (
              <div className="text-center py-2">
                <span className="text-xs text-muted-foreground">
                  Todos os {transformedDeals.length} negócios carregados
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
      
      <Button 
        variant="ghost" 
        className="w-full mt-3" 
        size="sm"
        onClick={() => onNewDeal(stage.id)}
      >
        <Plus className="h-4 w-4 mr-2" /> Adicionar Negócio
      </Button>
    </div>
  );
}

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedTeamType, setSelectedTeamType] = useState("comercial");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Estado para modal de novo negócio
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<string | null>(null);

  // CORREÇÃO: Buscar equipes do banco para filtros dinâmicos
  const { data: teamsFromDB } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    }
  });

  // CORREÇÃO: Criar filtros de equipe dinâmicos baseados no banco + sistema estático
  const availableTeamTypes = useMemo(() => {
    const staticTypes = getAllCategories();
    const dynamicTypes: Array<{ id: string; info: any }> = [];

    // Adicionar teamTypes das equipes do banco que não estão no sistema estático
    if (teamsFromDB && Array.isArray(teamsFromDB)) {
      teamsFromDB.forEach((team: any) => {
        if (team.teamType && !staticTypes.find(st => st.id === team.teamType)) {
          // Criar funil dinâmico para teamType não mapeado
          const dynamicFunnel = getDynamicFunnelForTeamType(team.teamType);
          dynamicTypes.push({
            id: team.teamType,
            info: dynamicFunnel
          });
        }
      });
    }

    return [...staticTypes, ...dynamicTypes];
  }, [teamsFromDB]);

  // OTIMIZAÇÃO: Query padrão com limit 10 para carregamento inicial mais rápido
  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['/api/deals', selectedTeamType],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '10', // REDUZIDO: 10 negócios iniciais por coluna para otimizar performance
        teamType: selectedTeamType
      });
      
      const response = await fetch(`/api/deals?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar negócios');
      return response.json();
    },
    enabled: !!selectedTeamType // Só busca se tipo de equipe estiver selecionado
  });

  // Extrair dados da resposta padrão
  const rawDeals = dealsResponse?.deals || [];
  const totalDeals = dealsResponse?.totalDeals || 0;
  
  // Debug logs para paginação removidos para evitar erro de JSON parsing

  // CORREÇÃO: Usar configuração dinâmica ao invés de estática
  const currentTeamCategory = getCategoryInfo(selectedTeamType) || 
    getDynamicFunnelForTeamType(selectedTeamType);
  
  // OTIMIZAÇÃO: Resetar dados do infiniteQuery quando teamType muda
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/deals', selectedTeamType] });
  }, [selectedTeamType, queryClient]);

  // Transform deals (already filtered by backend)
  const deals = rawDeals.map((deal: any) => ({
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
        queryKey: ['/api/deals', selectedTeamType] 
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
      await queryClient.cancelQueries({ queryKey: ['/api/deals', selectedTeamType] });
      
      // Snapshot the previous value
      const previousDeals = queryClient.getQueryData(['/api/deals', selectedTeamType]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/deals', selectedTeamType], (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            deals: page.deals.map((deal: any) => 
              deal.id === dealId ? { ...deal, stage } : deal
            )
          }))
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDeals) {
        queryClient.setQueryData(['/api/deals', selectedTeamType], context.previousDeals);
      }
      console.error('Erro ao atualizar estágio do negócio:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: ['/api/deals', selectedTeamType] 
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
      stage: selectedStageForNewDeal || currentTeamCategory.stages[0].id, // Usa estágio selecionado ou primeiro do funil
      teamType: selectedTeamType
    };

    createDealMutation.mutate(dealData);
  };

  // Function to open modal for specific stage
  const openNewDealDialog = (stageId?: string) => {
    setSelectedStageForNewDeal(stageId || null);
    setIsNewDealDialogOpen(true);
  };

  const filtered = deals.filter((deal: any) =>
    deal.name.toLowerCase().includes(search.toLowerCase()) ||
    deal.company.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsForStage = (stageId: string) => filtered.filter((d: any) => d.stage === stageId);

  const calculateStageValue = (deals: any[]) => deals.reduce((acc: number, deal: any) => acc + (deal.value || 0), 0);

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

    const deal = deals.find((d: any) => String(d.id) === draggableId);
    if (!deal) return;

    // Update deal stage in database
    updateDealMutation.mutate({
      dealId: deal.id,
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
            <Select value={selectedTeamType} onValueChange={setSelectedTeamType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {/* CORREÇÃO: Filtros dinâmicos baseados em equipes do banco */}
                {availableTeamTypes.map(({ id, info }) => (
                  <SelectItem key={id} value={id}>
                    {info.name}
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
                        ? currentTeamCategory.stages.find(s => s.id === selectedStageForNewDeal)?.name
                        : currentTeamCategory.stages[0].name
                    } ({currentTeamCategory.name})
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
          <DragDropContext onDragEnd={handleDragEnd} enableDefaultSensors={false}>
            <div className="h-full">
              <div className="flex gap-4 h-full pb-4 deals-kanban-container">
                {currentTeamCategory.stages.map((stage: any) => {
                  const stageDeals = getDealsForStage(stage.id);
                  return (
                    <KanbanColumn
                      key={stage.id}
                      stage={stage}
                      deals={stageDeals}
                      teamType={selectedTeamType}
                      onDragEnd={handleDragEnd}
                      onNewDeal={openNewDealDialog}
                    />
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
                      {currentTeamCategory.stages.find((s: any) => s.id === deal.stage)?.name}
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

        {/* Indicador de status de carregamento simplificado */}
        <div className="flex items-center justify-center px-6 py-4 border-t bg-white dark:bg-gray-800">
          <div className="text-sm text-muted-foreground text-center">
            {isLoading ? (
              'Carregando negócios...'
            ) : (
              `${rawDeals.length} negócios carregados (mostrando os 10 mais recentes por coluna)`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}