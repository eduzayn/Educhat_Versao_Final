import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { PeriodFilter, ChannelFilter, FilterContainer } from '@/shared/components/filters';
import { Download, Calendar } from "lucide-react";
import { SalesDashboardStats } from './components/SalesDashboardStats';
import { SalesDashboardCharts } from './components/SalesDashboardCharts';
import { SalesDashboardDistribution } from './components/SalesDashboardDistribution';
import { SalesDashboardSummary } from './components/SalesDashboardSummary';
import { SalesDashboardGoalsDialog } from './components/SalesDashboardGoalsDialog';
import { SalesDashboardTeamsDialog } from './components/SalesDashboardTeamsDialog';
import { SalesDashboardMeetingDialog } from './components/SalesDashboardMeetingDialog';

export function SalesDashboard() {
  const [period, setPeriod] = useState('month');
  const [channel, setChannel] = useState('all');
  const [salesperson, setSalesperson] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/sales/dashboard', { period, channel, salesperson }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/dashboard?period=${period}&channel=${channel}&salesperson=${salesperson}`);
      if (!response.ok) throw new Error('Erro ao carregar dashboard');
      return response.json();
    }
  });

  // Buscar dados dos gráficos
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['/api/sales/charts', { period }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/charts?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar gráficos');
      return response.json();
    }
  });

  // Buscar vendedores para filtros
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  const isLoading = dashboardLoading || chartsLoading;

  // Função para exportar dados
  const handleExport = async () => {
    try {
      let dateParams = '';
      if (period === 'custom' && customDateStart && customDateEnd) {
        dateParams = `&dateStart=${customDateStart}&dateEnd=${customDateEnd}`;
      }
      
      const response = await fetch(`/api/sales/export?period=${period}&channel=${channel}&salesperson=${salesperson}${dateParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `vendas_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  const defaultDashboard = dashboardData || {
    totalSalesThisMonth: 0,
    totalSalesLastMonth: 0,
    totalDealsThisMonth: 0,
    totalDealsLastMonth: 0,
    conversionRate: 0,
    averageTicket: 0
  };

  const defaultCharts = chartsData || {
    salesByPerson: [],
    salesEvolution: [],
    maxValue: 0,
    distributionByType: []
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
          <h2 className="text-2xl font-bold">Dashboard de Vendas</h2>
          <p className="text-muted-foreground">Visão geral do desempenho da equipe comercial</p>
        </div>

        <FilterContainer>
          <PeriodFilter
            value={period}
            onValueChange={setPeriod}
            className="w-40"
            includeCustom={true}
          />

          {period === 'custom' && (
            <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {customDateStart && customDateEnd 
                    ? `${customDateStart} - ${customDateEnd}`
                    : 'Definir período'
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
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsCustomDateOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setIsCustomDateOpen(false)}
                      disabled={!customDateStart || !customDateEnd}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <ChannelFilter
            value={channel}
            onValueChange={setChannel}
            className="w-40"
          />

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </FilterContainer>
      </div>

      {/* Cards de Métricas Principais */}
      <SalesDashboardStats data={defaultDashboard} />

      {/* Gráficos */}
      <SalesDashboardCharts data={defaultCharts} />

      {/* Distribuição por Tipo e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesDashboardDistribution data={defaultCharts} />
        <SalesDashboardSummary 
          data={defaultCharts}
          onGoalsClick={() => setShowGoalsDialog(true)}
          onTeamsClick={() => setShowTeamsDialog(true)}
          onMeetingClick={() => setShowMeetingDialog(true)}
        />
      </div>

      {/* Diálogos */}
      <SalesDashboardGoalsDialog 
        open={showGoalsDialog}
        onOpenChange={setShowGoalsDialog}
      />

      <SalesDashboardTeamsDialog 
        open={showTeamsDialog}
        onOpenChange={setShowTeamsDialog}
        activeSalespeople={defaultCharts.salesByPerson?.length || 0}
      />

      <SalesDashboardMeetingDialog 
        open={showMeetingDialog}
        onOpenChange={setShowMeetingDialog}
      />
    </div>
  );
} 