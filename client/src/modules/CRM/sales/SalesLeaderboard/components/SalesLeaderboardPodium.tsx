import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Medal, Crown, Award } from "lucide-react";

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

interface SalesLeaderboardPodiumProps {
  ranking: LeaderboardEntry[];
  metric: string;
}

export function SalesLeaderboardPodium({ ranking, metric }: SalesLeaderboardPodiumProps) {
  if (ranking.length < 3) return null;

  return (
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
            <h3 className="font-medium text-sm">{ranking[1]?.name}</h3>
            <p className="text-xs text-muted-foreground">2º Lugar</p>
            <div className="text-lg font-bold mt-2">
              {metric === 'sales' ? `R$ ${ranking[1]?.totalSales?.toLocaleString('pt-BR')}` :
               metric === 'deals' ? `${ranking[1]?.totalDeals} negócios` :
               metric === 'conversion' ? `${ranking[1]?.conversionRate?.toFixed(1)}%` :
               `R$ ${ranking[1]?.averageTicket?.toLocaleString('pt-BR')}`}
            </div>
          </div>

          {/* 1º Lugar */}
          <div className="text-center transform -translate-y-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Crown className="h-10 w-10 text-yellow-500" />
            </div>
            <h3 className="font-bold">{ranking[0]?.name}</h3>
            <p className="text-sm text-yellow-600">🏆 Campeão</p>
            <div className="text-xl font-bold mt-2">
              {metric === 'sales' ? `R$ ${ranking[0]?.totalSales?.toLocaleString('pt-BR')}` :
               metric === 'deals' ? `${ranking[0]?.totalDeals} negócios` :
               metric === 'conversion' ? `${ranking[0]?.conversionRate?.toFixed(1)}%` :
               `R$ ${ranking[0]?.averageTicket?.toLocaleString('pt-BR')}`}
            </div>
          </div>

          {/* 3º Lugar */}
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="font-medium text-sm">{ranking[2]?.name}</h3>
            <p className="text-xs text-muted-foreground">3º Lugar</p>
            <div className="text-lg font-bold mt-2">
              {metric === 'sales' ? `R$ ${ranking[2]?.totalSales?.toLocaleString('pt-BR')}` :
               metric === 'deals' ? `${ranking[2]?.totalDeals} negócios` :
               metric === 'conversion' ? `${ranking[2]?.conversionRate?.toFixed(1)}%` :
               `R$ ${ranking[2]?.averageTicket?.toLocaleString('pt-BR')}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 