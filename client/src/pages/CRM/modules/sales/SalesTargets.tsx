import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Label } from '@/shared/ui/ui/label';
import { Progress } from '@/shared/ui/ui/progress';
import { Badge } from '@/shared/ui/ui/badge';
import { 
  Plus, 
  Edit, 
  Filter, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar
} from "lucide-react";
import { useAuth } from '@/shared/lib/hooks/useAuth';
// Toast notifications will be handled inline

interface SalesTarget {
  id: number;
  salespersonId: number;
  salespersonName: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'overdue';
}

export function SalesTargets() {
  const [period, setPeriod] = useState('month');
  const [status, setStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);
  
  // Toast notifications handled inline
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar se usuário pode criar/editar metas (apenas gerentes e admin)
  const canManageTargets = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  // Buscar metas de vendas
  const { data: targets, isLoading } = useQuery({
    queryKey: ['/api/sales/targets', { period, status }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/targets?period=${period}&status=${status}`);
      if (!response.ok) throw new Error('Erro ao carregar metas de vendas');
      return response.json();
    }
  });

  // Buscar vendedores para dropdown
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  // Mutation para criar/editar meta
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const targetData = {
      salespersonId: parseInt(formData.get('salespersonId') as string),
      targetValue: parseFloat(formData.get('targetValue') as string),
      period: formData.get('period') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string
    };

    targetMutation.mutate(targetData);
  };

  const getStatusBadge = (target: SalesTarget) => {
    const achievement = (target.currentValue / target.targetValue) * 100;
    
    if (achievement >= 100) {
      return <Badge className="bg-green-100 text-green-800">Atingida</Badge>;
    } else if (achievement >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800">Próximo</Badge>;
    } else if (target.status === 'overdue') {
      return <Badge className="bg-red-100 text-red-800">Atrasada</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTarget(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTarget ? 'Editar Meta' : 'Nova Meta de Vendas'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="salespersonId">Vendedor</Label>
                  <Select name="salespersonId" defaultValue={editingTarget?.salespersonId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespeople?.map((person: any) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetValue">Valor da Meta (R$)</Label>
                  <Input
                    name="targetValue"
                    type="number"
                    step="0.01"
                    defaultValue={editingTarget?.targetValue}
                    placeholder="Ex: 50000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="period">Período</Label>
                  <Select name="period" defaultValue={editingTarget?.period || 'month'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Semanal</SelectItem>
                      <SelectItem value="month">Mensal</SelectItem>
                      <SelectItem value="quarter">Trimestral</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      name="startDate"
                      type="date"
                      defaultValue={editingTarget?.startDate}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      name="endDate"
                      type="date"
                      defaultValue={editingTarget?.endDate}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={targetMutation.isPending}>
                    {targetMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets?.totalTargets || 0}</div>
            <p className="text-xs text-muted-foreground">Metas ativas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{targets?.completedTargets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {targets?.totalTargets > 0 
                ? `${((targets?.completedTargets || 0) / targets.totalTargets * 100).toFixed(1)}% do total`
                : '0% do total'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets?.activeSalespeople || 0}</div>
            <p className="text-xs text-muted-foreground">Com metas definidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atingimento Médio</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets?.averageAchievement?.toFixed(1) || '0'}%</div>
            <p className="text-xs text-muted-foreground">Performance geral da equipe</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Metas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          {targets?.targets?.length > 0 ? (
            <div className="space-y-4">
              {targets.targets.map((target: SalesTarget) => {
                const achievement = (target.currentValue / target.targetValue) * 100;
                return (
                  <div key={target.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {target.salespersonName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{target.salespersonName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {target.period} • {new Date(target.startDate).toLocaleDateString('pt-BR')} - {new Date(target.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(target)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTarget(target);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Meta: R$ {target.targetValue.toLocaleString('pt-BR')}</span>
                        <span>Atual: R$ {target.currentValue.toLocaleString('pt-BR')}</span>
                      </div>
                      <Progress value={Math.min(100, achievement)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{achievement.toFixed(1)}% atingido</span>
                        <span>
                          {achievement >= 100 
                            ? `+R$ ${(target.currentValue - target.targetValue).toLocaleString('pt-BR')} acima da meta`
                            : `R$ ${(target.targetValue - target.currentValue).toLocaleString('pt-BR')} restante`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma meta encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {canManageTargets 
                  ? 'Comece criando metas para seus vendedores'
                  : 'Nenhuma meta foi definida ainda'
                }
              </p>
              {canManageTargets && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}