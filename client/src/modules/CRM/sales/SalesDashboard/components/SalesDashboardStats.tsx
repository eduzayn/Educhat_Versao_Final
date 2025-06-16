import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3 
} from "lucide-react";

interface DashboardData {
  totalSalesThisMonth: number;
  totalSalesLastMonth: number;
  totalDealsThisMonth: number;
  totalDealsLastMonth: number;
  conversionRate: number;
  averageTicket: number;
}

interface SalesDashboardStatsProps {
  data: DashboardData;
}

export function SalesDashboardStats({ data }: SalesDashboardStatsProps) {
  // Calcular variação percentual
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const salesGrowth = calculateGrowth(data.totalSalesThisMonth, data.totalSalesLastMonth);
  const dealsGrowth = calculateGrowth(data.totalDealsThisMonth, data.totalDealsLastMonth);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas do Período</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {data.totalSalesThisMonth.toLocaleString('pt-BR')}
          </div>
          <div className="flex items-center text-xs">
            {salesGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(salesGrowth).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs período anterior</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Negócios Fechados</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.totalDealsThisMonth}
          </div>
          <div className="flex items-center text-xs">
            {dealsGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={dealsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(dealsGrowth).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs período anterior</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {data.conversionRate.toFixed(1)}%
          </div>
          <Progress value={data.conversionRate} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <BarChart3 className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            R$ {data.averageTicket.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por negócio fechado
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 