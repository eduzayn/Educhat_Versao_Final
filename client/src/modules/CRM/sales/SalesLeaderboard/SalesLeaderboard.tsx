import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Download } from "lucide-react";
import { SalesLeaderboardStats } from './components/SalesLeaderboardStats';
import { SalesLeaderboardPodium } from './components/SalesLeaderboardPodium';
import { SalesLeaderboardTable } from './components/SalesLeaderboardTable';

interface LeaderboardEntry {
  id: number;
  name: string;
  position: number;
  totalSales: number;
  totalDeals: number;
  conversionRate: number;
  averageTicket: number;
  targetAchievement: number;
  monthlyGrowth: number;
}

export function SalesLeaderboard() {
  const [period, setPeriod] = useState('month');
  const [metric, setMetric] = useState('sales');

  // Buscar dados do ranking
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/sales/leaderboard', { period, metric }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/leaderboard?period=${period}&metric=${metric}`);
      if (!response.ok) throw new Error('Erro ao carregar ranking');
      return response.json();
    }
  });

  const handleExport = () => {
    if (!leaderboardData?.ranking) return;
    
    const headers = ['Posição', 'Vendedor', 'Vendas', 'Negócios', 'Conversão %', 'Ticket Médio', 'Meta %'];
    const rows = leaderboardData.ranking.map((entry: LeaderboardEntry) => [
      entry.position,
      entry.name,
      `R$ ${entry.totalSales.toLocaleString('pt-BR')}`,
      entry.totalDeals,
      `${entry.conversionRate.toFixed(1)}%`,
      `R$ ${entry.averageTicket.toLocaleString('pt-BR')}`,
      `${entry.targetAchievement.toFixed(1)}%`
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ranking_vendedores_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = leaderboardData || { ranking: [], stats: {} };

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Ranking de Vendedores</h2>
          <p className="text-muted-foreground">Classificação dos melhores performadores da equipe</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Vendas (Valor)</SelectItem>
              <SelectItem value="deals">Negócios Fechados</SelectItem>
              <SelectItem value="conversion">Taxa de Conversão</SelectItem>
              <SelectItem value="ticket">Ticket Médio</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas do Ranking */}
      <SalesLeaderboardStats 
        stats={defaultData.stats}
        metric={metric}
        totalSalespeople={defaultData.ranking?.length || 0}
      />

      {/* Pódio dos 3 Primeiros */}
      <SalesLeaderboardPodium 
        ranking={defaultData.ranking}
        metric={metric}
      />

      {/* Ranking Completo */}
      <SalesLeaderboardTable 
        ranking={defaultData.ranking}
        metric={metric}
      />
    </div>
  );
} 