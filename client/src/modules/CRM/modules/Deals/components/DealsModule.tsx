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
import { teamConfigs } from '@/shared/lib/crmFunnels';
import { useToast } from '@/shared/lib/hooks/use-toast';
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
import { DealsHeader } from './DealsHeader';
import { DealsKanban } from './DealsKanban';
import { DealsEditDialog } from './DealsEditDialog';

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedTeam, setSelectedTeam] = useState("comercial");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Estado para modal de novo negócio
  const [isNewDealDialogOpen, setIsNewDealDialogOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<string | null>(null);
  
  // Estado para modal de edição de negócio
  const [isEditDealDialogOpen, setIsEditDealDialogOpen] = useState(false);
  const [selectedDealForEdit, setSelectedDealForEdit] = useState<Deal | null>(null);

  // State para paginação
  const [page, setPage] = useState(1);
  const limit = 50;

  // Estados para drag and drop nativo
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
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
  const { data: funnelsData = [] } = useQuery({
    queryKey: ['/api/funnels'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  const safeFunnelsData = Array.isArray(funnelsData) ? funnelsData : [];

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
    mutationFn: async (dealData: Partial<Deal>) => {
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
    return deals.filter((deal: Deal) => deal.stage === stageId);
  };

  // Função para calcular valor total de um estágio
  const calculateStageValue = (stageDeals: Deal[]) => {
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
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      value: parseFloat(formData.get('value') as string) || 0,
      stage: selectedStageForNewDeal || currentTeam?.stages?.[0]?.id,
      teamType: selectedTeam,
      probability: parseInt(formData.get('probability') as string) || 50,
      description: formData.get('description') as string,
      owner: 'Admin',
      tags: []
    };

    createDealMutation.mutate(dealData);
  };

  // Handlers para drag and drop nativo
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
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
  const handleEditDeal = (deal: Deal) => {
    setSelectedDealForEdit(deal);
    setIsEditDealDialogOpen(true);
  };

  // Função para atualizar negócio completo
  const updateFullDealMutation = useMutation({
    mutationFn: async (dealData: Partial<Deal>) => {
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

          <DealsHeader
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            funnelsData={safeFunnelsData}
            getFunnelIcon={getFunnelIcon}
            search={search}
            setSearch={setSearch}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isNewDealDialogOpen={isNewDealDialogOpen}
            setIsNewDealDialogOpen={setIsNewDealDialogOpen}
            openNewDealDialog={openNewDealDialog}
            handleNewDealSubmit={handleNewDealSubmit}
            selectedStageForNewDeal={selectedStageForNewDeal}
            currentTeam={currentTeam}
            createDealMutation={createDealMutation}
          />
        </div>

        <div className="overflow-hidden flex-1">
          {viewMode === 'kanban' ? (
            <DealsKanban
              stages={currentTeam?.stages || []}
              getDealsForStage={getDealsForStage}
              dragOverStage={dragOverStage}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragStart={handleDragStart}
              handleEditDeal={handleEditDeal}
              calculateStageValue={calculateStageValue}
            />
          ) : (
            <div className="p-6">
              <div className="text-center text-muted-foreground py-8">
                Visualização em tabela em desenvolvimento
              </div>
            </div>
          )}
        </div>
      </div>

      <DealsEditDialog
        open={isEditDealDialogOpen}
        onOpenChange={setIsEditDealDialogOpen}
        selectedDealForEdit={selectedDealForEdit}
        updateFullDealMutation={updateFullDealMutation}
        setIsEditDealDialogOpen={setIsEditDealDialogOpen}
      />
    </div>
  );
} 