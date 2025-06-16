import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PieChart } from "lucide-react";
import { ResponsiveContainer, PieChart as RechartsPieChart, Cell, Tooltip } from 'recharts';

interface DistributionItem {
  type: string;
  value: number;
  percentage: number;
  deals: number;
}

interface DistributionData {
  distributionByType: DistributionItem[];
}

interface SalesDashboardDistributionProps {
  data: DistributionData;
}

export function SalesDashboardDistribution({ data }: SalesDashboardDistributionProps) {
  // Cores para os gráficos
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Distribuição por Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.distributionByType?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Tooltip 
                  formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                />
                <RechartsPieChart dataKey="value">
                  {data.distributionByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              {data.distributionByType.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      R$ {item.value.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.percentage}% • {item.deals} negócios
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhuma distribuição de vendas encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
} 