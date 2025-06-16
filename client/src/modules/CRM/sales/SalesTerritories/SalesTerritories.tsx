import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Plus } from "lucide-react";
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useFormSubmission, formatTerritoryData } from '@/shared/lib/utils/formHelpers';
import { SalesTerritoriesStats } from './components/SalesTerritoriesStats';
import { SalesTerritoriesMap } from './components/SalesTerritoriesMap';
import { SalesTerritoriesList } from './components/SalesTerritoriesList';
import { SalesTerritoriesDialog } from './components/SalesTerritoriesDialog';

interface Territory {
  id: number;
  name: string;
  description: string;
  states: string[];
  cities: string[];
  salespeople: string[];
  leadsCount: number;
  salesCount: number;
  salesValue: number;
  isActive: boolean;
}

export function SalesTerritories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canManageTerritories = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  const { data: territories, isLoading } = useQuery({
    queryKey: ['/api/sales/territories'],
    queryFn: async () => {
      const response = await fetch('/api/sales/territories');
      if (!response.ok) throw new Error('Erro ao carregar territórios');
      return response.json();
    }
  });

  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  const territoryMutation = useMutation({
    mutationFn: async (territoryData: any) => {
      const url = editingTerritory ? `/api/sales/territories/${editingTerritory.id}` : '/api/sales/territories';
      const method = editingTerritory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(territoryData)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar território');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/territories'] });
      setIsDialogOpen(false);
      setEditingTerritory(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (territoryId: number) => {
      const response = await fetch(`/api/sales/territories/${territoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar território');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/territories'] });
    }
  });

  const { handleFormSubmit } = useFormSubmission();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const territoryData = formatTerritoryData(formData);

    handleFormSubmit(territoryMutation, territoryData, {
      successMessage: "Território salvo com sucesso",
      errorMessage: "Erro ao salvar território",
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = territories || { territories: [], stats: {} };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Territórios de Vendas</h2>
          <p className="text-muted-foreground">Gerencie a distribuição geográfica de leads e vendedores</p>
        </div>

        {canManageTerritories && (
          <Button onClick={() => {
            setEditingTerritory(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Território
          </Button>
        )}
      </div>

      <SalesTerritoriesStats stats={defaultData.stats} />
      <SalesTerritoriesMap />
      
      <SalesTerritoriesList
        territories={defaultData.territories}
        canManageTerritories={canManageTerritories}
        onEdit={(territory) => {
          setEditingTerritory(territory);
          setIsDialogOpen(true);
        }}
        onDelete={(territoryId) => deleteMutation.mutate(territoryId)}
        onCreate={() => setIsDialogOpen(true)}
        isDeleting={deleteMutation.isPending}
      />

      <SalesTerritoriesDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        territory={editingTerritory}
        salespeople={salespeople || []}
        onSubmit={handleSubmit}
        isSubmitting={territoryMutation.isPending}
      />
    </div>
  );
} 