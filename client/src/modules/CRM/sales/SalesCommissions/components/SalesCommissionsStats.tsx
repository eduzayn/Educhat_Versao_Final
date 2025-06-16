import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { CommissionsData } from '@/shared/lib/types/sales';

interface SalesCommissionsStatsProps {
  data: CommissionsData;
}

export function SalesCommissionsStats({ data }: SalesCommissionsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {data.totalCommissions?.toLocaleString('pt-BR') || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Comissões geradas no período</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            R$ {data.totalPending?.toLocaleString('pt-BR') || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {data.totalPaid?.toLocaleString('pt-BR') || '0'}
          </div>
          <p className="text-xs text-muted-foreground">Já processadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {data.totalSales?.toLocaleString('pt-BR') || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.totalSales > 0 
              ? `${((data.totalCommissions / data.totalSales) * 100).toFixed(1)}% em comissões`
              : 'Base para comissões'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 