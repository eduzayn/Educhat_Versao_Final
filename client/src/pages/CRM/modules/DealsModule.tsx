import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import type { Deal } from '@shared/schema';
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

// Configuração dos funis por macrosetor
const macrosetores = {
  comercial: {
    name: 'Comercial',
    stages: [
      { id: 'prospecting', name: 'Prospecção', color: 'bg-gray-500' },
      { id: 'qualified', name: 'Qualificado', color: 'bg-blue-500' },
      { id: 'proposal', name: 'Proposta', color: 'bg-yellow-500' },
      { id: 'negotiation', name: 'Negociação', color: 'bg-orange-500' },
      { id: 'won', name: 'Fechado', color: 'bg-green-500' }
    ]
  },
  suporte: {
    name: 'Suporte',
    stages: [
      { id: 'novo', name: 'Novo', color: 'bg-red-500' },
      { id: 'em_andamento', name: 'Em Andamento', color: 'bg-orange-500' },
      { id: 'aguardando_cliente', name: 'Aguardando Cliente', color: 'bg-yellow-500' },
      { id: 'resolvido', name: 'Resolvido', color: 'bg-green-500' }
    ]
  },
  cobranca: {
    name: 'Cobrança',
    stages: [
      { id: 'debito_detectado', name: 'Débito Detectado', color: 'bg-red-500' },
      { id: 'tentativa_contato', name: 'Tentativa de Contato', color: 'bg-orange-500' },
      { id: 'negociacao', name: 'Negociação', color: 'bg-yellow-500' },
      { id: 'quitado', name: 'Quitado', color: 'bg-green-500' },
      { id: 'encerrado', name: 'Encerrado', color: 'bg-gray-500' }
    ]
  }
};

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedMacrosetor, setSelectedMacrosetor] = useState("comercial");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // State para paginação
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch deals from database with pagination and filtering
  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['/api/deals', selectedMacrosetor, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        macrosetor: selectedMacrosetor
      });
      
      const response = await fetch(`/api/deals?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar negócios');
      return response.json();
    },
    enabled: !!selectedMacrosetor // Só busca se macrosetor estiver selecionado
  });

  const rawDeals = dealsResponse?.deals || [];
  const totalPages = dealsResponse?.totalPages || 1;
  const currentPage = dealsResponse?.currentPage || 1;

  // Get current macrosetor configuration
  const currentMacrosetor = macrosetores[selectedMacrosetor as keyof typeof macrosetores];
  
  // Reset page when macrosetor changes
  useEffect(() => {
    setPage(1);
  }, [selectedMacrosetor]);

  // Transform deals (already filtered by backend)
  const deals = rawDeals.map(deal => ({
      ...deal,
      id: deal.id.toString(),
      stage: deal.stage,
      tags: deal.tags ? (Array.isArray(deal.tags) ? deal.tags : JSON.parse(deal.tags as string || '[]')) : [],
      closeDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
      company: 'Empresa não definida',
      owner: deal.owner || 'Sistema',
      ownerAvatar: '',
      value: deal.value || 0,
      probability: deal.probability || 0
    }));

  // Update deal stage mutation
  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      return await apiRequest(`/api/deals/${dealId}`, 'PATCH', { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    }
  });

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
    <div className="h-full flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Negócios</h2>
              <p className="text-muted-foreground">
                Gerencie seu pipeline de vendas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedMacrosetor} onValueChange={setSelectedMacrosetor}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comercial">🏢 Comercial</SelectItem>
                <SelectItem value="suporte">🛠️ Suporte</SelectItem>
                <SelectItem value="cobranca">💰 Cobrança</SelectItem>
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

            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Negócio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="h-full p-6">
              <div className="flex gap-6 h-full overflow-x-auto">
                {currentMacrosetor.stages.map((stage: any) => {
                  const stageDeals = getDealsForStage(stage.id);
                  return (
                    <div key={stage.id} className="min-w-80 bg-muted/30 rounded-lg p-4 flex flex-col">
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
                            className={`space-y-3 flex-1 overflow-y-auto min-h-96 max-h-96 pr-2 deals-column-scroll ${
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
                                    <CardContent className="p-3 space-y-2">
                                      <div className="flex items-start justify-between">
                                        <p className="text-sm font-medium leading-tight">{deal.name}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Building2 className="h-3 w-3" />
                                        <span>{deal.company}</span>
                                      </div>
                                      <p className="text-sm text-green-600 font-semibold">
                                        R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">
                                          {deal.probability}% prob.
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{deal.owner}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {deal.tags.map((tag: string, i: number) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <Button variant="ghost" className="w-full mt-3" size="sm">
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
                      {currentMacrosetor.stages.find((s: any) => s.id === deal.stage)?.name}
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