import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Target, TrendingUp, Users, Calendar } from 'lucide-react';

interface SalesTargetsStatsProps {
  totalTargets: number;
  completedTargets: number;
  activeSalespeople: number;
  averageAchievement: number;
}

export function SalesTargetsStats({ totalTargets, completedTargets, activeSalespeople, averageAchievement }: SalesTargetsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTargets}</div>
          <p className="text-xs text-muted-foreground">Metas ativas no período</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completedTargets}</div>
          <p className="text-xs text-muted-foreground">
            {totalTargets > 0 
              ? `${((completedTargets / totalTargets) * 100).toFixed(1)}% do total`
              : '0% do total'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSalespeople}</div>
          <p className="text-xs text-muted-foreground">Com metas definidas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atingimento Médio</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageAchievement.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Performance geral da equipe</p>
        </CardContent>
      </Card>
    </div>
  );
} 