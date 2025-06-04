import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Users, 
  Award,
  Download,
  Filter
} from "lucide-react";

export function SalesDashboard() {
  const [period, setPeriod] = useState('month');
  const [channel, setChannel] = useState('all');
  const [salesperson, setSalesperson] = useState('all');

  // Buscar dados de vendas do backend
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/sales/dashboard', { period, channel, salesperson }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/dashboard?period=${period}&channel=${channel}&salesperson=${salesperson}`);
      if (!response.ok) throw new Error('Erro ao carregar dados de vendas');
      return response.json();
    }
  });

  // Buscar dados para gráficos
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['/api/sales/charts', { period }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/charts?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar gráficos de vendas');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = salesData || {
    totalSales: 0,
    totalDeals: 0,
    conversionRate: 0,
    averageTicket: 0,
    totalSalesThisMonth: 0,
    totalSalesLastMonth: 0,
    totalDealsThisMonth: 0,
    totalDealsLastMonth: 0
  };

  const salesGrowth = defaultData.totalSalesLastMonth > 0 
    ? ((defaultData.totalSalesThisMonth - defaultData.totalSalesLastMonth) / defaultData.totalSalesLastMonth) * 100 
    : 0;

  const dealsGrowth = defaultData.totalDealsLastMonth > 0 
    ? ((defaultData.totalDealsThisMonth - defaultData.totalDealsLastMonth) / defaultData.totalDealsLastMonth) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>

        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Canal de entrada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
          </SelectContent>
        </Select>

        <Select value={salesperson} onValueChange={setSalesperson}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os vendedores</SelectItem>
            <SelectItem value="ana">Ana Lucia</SelectItem>
            <SelectItem value="rian">Rian</SelectItem>
            <SelectItem value="erick">Erick</SelectItem>
            <SelectItem value="tamires">Tamires</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {defaultData.totalSalesThisMonth?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(salesGrowth).toFixed(1)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Ganhos</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {defaultData.totalDealsThisMonth || '0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {dealsGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(dealsGrowth).toFixed(1)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {defaultData.conversionRate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Negócios ganhos / Total de leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {defaultData.averageTicket?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {chartData?.salesByPerson?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">{item.name?.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">R$ {item.value?.toLocaleString('pt-BR')}</div>
                      <div className="text-xs text-muted-foreground">{item.deals} negócios</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    Dados não disponíveis para o período selecionado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução das Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {chartData?.salesEvolution?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.period}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (item.value / (chartData.maxValue || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">R$ {item.value?.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    Dados não disponíveis para o período selecionado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Tipo de Negócio */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Macrosetor</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chartData?.distributionByType?.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">{item.percentage}%</div>
                  <div className="text-sm text-muted-foreground">{item.type}</div>
                  <div className="text-xs text-muted-foreground">
                    R$ {item.value?.toLocaleString('pt-BR')} ({item.deals} negócios)
                  </div>
                </div>
              )) || (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  Dados não disponíveis para o período selecionado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}