import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Crown, Trophy, TrendingUp, Star } from "lucide-react";

interface LeaderboardStats {
  leader?: string;
  averageSales?: number;
  averageDeals?: number;
  averageConversion?: number;
  averageTicket?: number;
  bestGrowth?: number;
}

interface SalesLeaderboardStatsProps {
  stats: LeaderboardStats;
  metric: string;
  totalSalespeople: number;
}

export function SalesLeaderboardStats({ stats, metric, totalSalespeople }: SalesLeaderboardStatsProps) {
  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'sales': return 'Vendas';
      case 'deals': return 'Negócios Fechados';
      case 'conversion': return 'Taxa de Conversão';
      case 'ticket': return 'Ticket Médio';
      default: return 'Vendas';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Líder do {getMetricLabel(metric)}</CardTitle>
          <Crown className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{stats.leader || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Melhor performance no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
          <Trophy className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSalespeople}</div>
          <p className="text-xs text-muted-foreground">Participando do ranking</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média da Equipe</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metric === 'sales' ? `R$ ${stats.averageSales?.toLocaleString('pt-BR') || '0'}` :
             metric === 'deals' ? stats.averageDeals || '0' :
             metric === 'conversion' ? `${stats.averageConversion?.toFixed(1) || '0'}%` :
             `R$ ${stats.averageTicket?.toLocaleString('pt-BR') || '0'}`}
          </div>
          <p className="text-xs text-muted-foreground">Performance média</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Melhor Crescimento</CardTitle>
          <Star className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{stats.bestGrowth?.toFixed(1) || '0'}%
          </div>
          <p className="text-xs text-muted-foreground">Maior evolução</p>
        </CardContent>
      </Card>
    </div>
  );
} 