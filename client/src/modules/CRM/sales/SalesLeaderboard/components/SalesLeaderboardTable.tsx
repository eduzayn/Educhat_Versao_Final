import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Trophy, Crown, Medal, Award } from "lucide-react";

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

interface SalesLeaderboardTableProps {
  ranking: LeaderboardEntry[];
  metric: string;
}

export function SalesLeaderboardTable({ ranking, metric }: SalesLeaderboardTableProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking Completo - {getMetricLabel(metric)}</CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length > 0 ? (
          <div className="space-y-4">
            {ranking.map((entry, index) => (
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
  );
} 