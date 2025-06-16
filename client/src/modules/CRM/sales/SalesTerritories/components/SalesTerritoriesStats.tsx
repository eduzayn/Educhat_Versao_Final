import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { MapPin, Users, Target, TrendingUp } from "lucide-react";

interface TerritoryStats {
  totalTerritories: number;
  allocatedSalespeople: number;
  totalLeads: number;
  totalSales: number;
}

interface SalesTerritoriesStatsProps {
  stats: TerritoryStats;
}

export function SalesTerritoriesStats({ stats }: SalesTerritoriesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Territórios</CardTitle>
          <MapPin className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTerritories || 0}</div>
          <p className="text-xs text-muted-foreground">Territórios ativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendedores Alocados</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.allocatedSalespeople || 0}</div>
          <p className="text-xs text-muted-foreground">Com territórios definidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Distribuídos</CardTitle>
          <Target className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads || 0}</div>
          <p className="text-xs text-muted-foreground">Por região</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas por Território</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats.totalSales?.toLocaleString('pt-BR') || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Volume total</p>
        </CardContent>
      </Card>
    </div>
  );
} 