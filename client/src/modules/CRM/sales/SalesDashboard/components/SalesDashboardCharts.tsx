import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Users, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesEvolution {
  period: string;
  value: number;
}

interface SalesByPerson {
  name: string;
  value: number;
}

interface ChartsData {
  salesEvolution: SalesEvolution[];
  salesByPerson: SalesByPerson[];
}

interface SalesDashboardChartsProps {
  data: ChartsData;
}

export function SalesDashboardCharts({ data }: SalesDashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Evolução das Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolução das Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.salesEvolution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.salesEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado de vendas encontrado para o período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendas por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendas por Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.salesByPerson?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.salesByPerson} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum vendedor com vendas no período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 