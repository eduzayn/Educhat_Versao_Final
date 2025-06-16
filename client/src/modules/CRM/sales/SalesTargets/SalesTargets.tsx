import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Plus } from "lucide-react";
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useFormSubmission, formatSalesData } from '@/shared/lib/utils/formHelpers';
import { SalesTarget } from '@/shared/lib/types/sales';
import { SalesTargetsStats } from './components/SalesTargetsStats';
import { SalesTargetsList } from './components/SalesTargetsList';
import { SalesTargetsDialog } from './components/SalesTargetsDialog';

export function SalesTargets() {
  const [period, setPeriod] = useState('month');
  const [status, setStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canManageTargets = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  const { data: targets, isLoading } = useQuery({
    queryKey: ['/api/sales/targets', { period, status }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/targets?period=${period}&status=${status}`);
      if (!response.ok) throw new Error('Erro ao carregar metas de vendas');
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

  const targetMutation = useMutation({
    mutationFn: async (targetData: any) => {
      const url = editingTarget ? `/api/sales/targets/${editingTarget.id}` : '/api/sales/targets';
      const method = editingTarget ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/targets'] });
      setIsDialogOpen(false);
      setEditingTarget(null);
      console.log("Meta salva com sucesso!");
    },
    onError: () => {
      console.error("Erro ao salvar meta");
    }
  });

  const { handleFormSubmit } = useFormSubmission();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const targetData = formatSalesData(formData);

    handleFormSubmit(targetMutation, targetData, {
      successMessage: "Meta de vendas salva com sucesso",
      errorMessage: "Erro ao salvar meta de vendas",
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Carregando metas de vendas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Metas de Vendas</h2>
          <p className="text-muted-foreground">Acompanhe o progresso das metas da equipe</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="completed">Atingidas</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
            </SelectContent>
          </Select>

          {canManageTargets && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          )}
        </div>
      </div>

      <SalesTargetsStats
        totalTargets={targets?.totalTargets || 0}
        completedTargets={targets?.completedTargets || 0}
        activeSalespeople={targets?.activeSalespeople || 0}
        averageAchievement={targets?.averageAchievement || 0}
      />

      <SalesTargetsList
        targets={targets?.targets || []}
        canManageTargets={canManageTargets}
        onEdit={(target) => {
          setEditingTarget(target);
          setIsDialogOpen(true);
        }}
        onCreate={() => setIsDialogOpen(true)}
      />

      <SalesTargetsDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTarget(null);
        }}
        onSubmit={handleSubmit}
        editingTarget={editingTarget}
        salespeople={salespeople || []}
        isPending={targetMutation.isPending}
      />
    </div>
  );
} 