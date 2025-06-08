import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Badge } from '../../badge';
import { Avatar, AvatarFallback } from '../../avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Target, 
  DollarSign,
  Download,
  Crown,
  Star
} from "lucide-react";

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

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">{position}</span>
          </div>
        );
    }
  };

  const getRankBadge = (position: number) => {
    if (position === 1) {
      return <Badge className="bg-yellow-100 text-yellow-800">🥇 1º Lugar</Badge>;
    } else if (position === 2) {
      return <Badge className="bg-gray-100 text-gray-800">🥈 2º Lugar</Badge>;
    } else if (position === 3) {
      return <Badge className="bg-amber-100 text-amber-800">🥉 3º Lugar</Badge>;
    } else {
      return <Badge variant="outline">{position}º Lugar</Badge>;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'sales': return 'Vendas';
      case 'deals': return 'Negócios Fechados';
      case 'conversion': return 'Taxa de Conversão';
      case 'ticket': return 'Ticket Médio';
      default: return 'Vendas';
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líder do {getMetricLabel(metric)}</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{defaultData.stats?.leader || 'N/A'}</div>
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
            <div className="text-2xl font-bold">{defaultData.ranking?.length || 0}</div>
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
              {metric === 'sales' ? `R$ ${defaultData.stats?.averageSales?.toLocaleString('pt-BR') || '0'}` :
               metric === 'deals' ? defaultData.stats?.averageDeals || '0' :
               metric === 'conversion' ? `${defaultData.stats?.averageConversion?.toFixed(1) || '0'}%` :
               `R$ ${defaultData.stats?.averageTicket?.toLocaleString('pt-BR') || '0'}`}
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
              +{defaultData.stats?.bestGrowth?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Maior evolução</p>
          </CardContent>
        </Card>
      </div>

      {/* Pódio dos 3 Primeiros */}
      {defaultData.ranking?.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Pódio - Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-end gap-8">
              {/* 2º Lugar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Medal className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="font-medium text-sm">{defaultData.ranking[1]?.name}</h3>
                <p className="text-xs text-muted-foreground">2º Lugar</p>
                <div className="text-lg font-bold mt-2">
                  {metric === 'sales' ? `R$ ${defaultData.ranking[1]?.totalSales?.toLocaleString('pt-BR')}` :
                   metric === 'deals' ? `${defaultData.ranking[1]?.totalDeals} negócios` :
                   metric === 'conversion' ? `${defaultData.ranking[1]?.conversionRate?.toFixed(1)}%` :
                   `R$ ${defaultData.ranking[1]?.averageTicket?.toLocaleString('pt-BR')}`}
                </div>
              </div>

              {/* 1º Lugar */}
              <div className="text-center transform -translate-y-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                  <Crown className="h-10 w-10 text-yellow-500" />
                </div>
                <h3 className="font-bold">{defaultData.ranking[0]?.name}</h3>
                <p className="text-sm text-yellow-600">🏆 Campeão</p>
                <div className="text-xl font-bold mt-2">
                  {metric === 'sales' ? `R$ ${defaultData.ranking[0]?.totalSales?.toLocaleString('pt-BR')}` :
                   metric === 'deals' ? `${defaultData.ranking[0]?.totalDeals} negócios` :
                   metric === 'conversion' ? `${defaultData.ranking[0]?.conversionRate?.toFixed(1)}%` :
                   `R$ ${defaultData.ranking[0]?.averageTicket?.toLocaleString('pt-BR')}`}
                </div>
              </div>

              {/* 3º Lugar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-medium text-sm">{defaultData.ranking[2]?.name}</h3>
                <p className="text-xs text-muted-foreground">3º Lugar</p>
                <div className="text-lg font-bold mt-2">
                  {metric === 'sales' ? `R$ ${defaultData.ranking[2]?.totalSales?.toLocaleString('pt-BR')}` :
                   metric === 'deals' ? `${defaultData.ranking[2]?.totalDeals} negócios` :
                   metric === 'conversion' ? `${defaultData.ranking[2]?.conversionRate?.toFixed(1)}%` :
                   `R$ ${defaultData.ranking[2]?.averageTicket?.toLocaleString('pt-BR')}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Completo */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo - {getMetricLabel(metric)}</CardTitle>
        </CardHeader>
        <CardContent>
          {defaultData.ranking?.length > 0 ? (
            <div className="space-y-4">
              {defaultData.ranking.map((entry: LeaderboardEntry, index: number) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getRankIcon(entry.position)}
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{entry.name}</h4>
                      {getRankBadge(entry.position)}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Vendas</div>
                      <div className="font-medium">R$ {entry.totalSales?.toLocaleString('pt-BR')}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Negócios</div>
                      <div className="font-medium">{entry.totalDeals}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Conversão</div>
                      <div className="font-medium">{entry.conversionRate?.toFixed(1)}%</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Ticket Médio</div>
                      <div className="font-medium">R$ {entry.averageTicket?.toLocaleString('pt-BR')}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Meta</div>
                      <div className={`font-medium ${
                        entry.targetAchievement >= 100 ? 'text-green-600' : 
                        entry.targetAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {entry.targetAchievement?.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Crescimento</div>
                      <div className={`font-medium ${
                        entry.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.monthlyGrowth >= 0 ? '+' : ''}{entry.monthlyGrowth?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground">
                O ranking aparecerá quando houver vendas no período selecionado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}