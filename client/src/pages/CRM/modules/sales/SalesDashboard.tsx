import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

export function SalesDashboard() {
  const [period, setPeriod] = useState('month');
  const [channel, setChannel] = useState('all');
  const [salesperson, setSalesperson] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

  // Buscar dados do dashboard com atualização em tempo real
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/sales/dashboard', { period, channel, salesperson }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/dashboard?period=${period}&channel=${channel}&salesperson=${salesperson}`);
      if (!response.ok) throw new Error('Erro ao carregar dashboard');
      return response.json();
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchInterval: 60000, // Atualizar a cada minuto como backup
    refetchOnWindowFocus: false // WebSocket cuida das atualizações
  });

  // Buscar dados dos gráficos com atualização em tempo real
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['/api/sales/charts', { period }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/charts?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar gráficos');
      return response.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false
  });

  // Buscar vendedores para filtros
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  const isLoading = dashboardLoading || chartsLoading;

  // Calcular variação percentual
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const defaultDashboard = dashboardData || {
    totalSalesThisMonth: 0,
    totalSalesLastMonth: 0,
    totalDealsThisMonth: 0,
    totalDealsLastMonth: 0,
    conversionRate: 0,
    averageTicket: 0
  };

  const defaultCharts = chartsData || {
    salesByPerson: [],
    salesEvolution: [],
    maxValue: 0,
    distributionByType: []
  };

  const salesGrowth = calculateGrowth(defaultDashboard.totalSalesThisMonth, defaultDashboard.totalSalesLastMonth);
  const dealsGrowth = calculateGrowth(defaultDashboard.totalDealsThisMonth, defaultDashboard.totalDealsLastMonth);

  // Cores para os gráficos
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Vendas</h2>
          <p className="text-muted-foreground">Visão geral do desempenho da equipe comercial</p>
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

          {period === 'custom' && (
            <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {customDateStart && customDateEnd 
                    ? `${new Date(customDateStart).toLocaleDateString('pt-BR')} - ${new Date(customDateEnd).toLocaleDateString('pt-BR')}`
                    : 'Definir período'
                  }
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtro de Data Personalizado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCustomDateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsCustomDateOpen(false)}>
                      Aplicar Filtro
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
            </SelectContent>
          </Select>

          <Select value={salesperson} onValueChange={setSalesperson}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos vendedores</SelectItem>
              {salespeople?.map((person: any) => (
                <SelectItem key={person.id} value={person.id.toString()}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {defaultDashboard.totalSalesThisMonth.toLocaleString('pt-BR')}
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
              {defaultDashboard.totalDealsThisMonth}
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
              {defaultDashboard.conversionRate.toFixed(1)}%
            </div>
            <Progress value={defaultDashboard.conversionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {defaultDashboard.averageTicket.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por negócio fechado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
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
            {defaultCharts.salesEvolution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defaultCharts.salesEvolution}>
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
            {defaultCharts.salesByPerson?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defaultCharts.salesByPerson} layout="horizontal">
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

      {/* Distribuição por Tipo e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Macrosetor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Macrosetor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {defaultCharts.distributionByType?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                    />
                    <RechartsPieChart dataKey="value">
                      {defaultCharts.distributionByType.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {defaultCharts.distributionByType.map((item: any, index: number) => (
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

        {/* Resumo Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vendedores ativos</span>
              <Badge variant="outline">{defaultCharts.salesByPerson?.length || 0}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maior venda</span>
              <span className="text-sm font-medium">
                R$ {defaultCharts.maxValue?.toLocaleString('pt-BR') || '0'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Canais ativos</span>
              <Badge variant="outline">{defaultCharts.distributionByType?.length || 0}</Badge>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Ações Rápidas</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowGoalsDialog(true)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Definir Metas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowTeamsDialog(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Equipe
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowMeetingDialog(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Definir Metas */}
      <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Definir Metas de Vendas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-goal">Meta Mensal (R$)</Label>
              <Input id="monthly-goal" placeholder="Ex: 50.000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarterly-goal">Meta Trimestral (R$)</Label>
              <Input id="quarterly-goal" placeholder="Ex: 150.000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-goal">Meta da Equipe (%)</Label>
              <Input id="team-goal" placeholder="Ex: 120" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowGoalsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowGoalsDialog(false)}>
              Salvar Metas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Gerenciar Equipe */}
      <Dialog open={showTeamsDialog} onOpenChange={setShowTeamsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Gerenciar Equipe de Vendas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Vendedores Ativos</h4>
                <div className="text-2xl font-bold text-green-600">
                  {defaultCharts.salesByPerson?.length || 0}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Performance Média</h4>
                <div className="text-2xl font-bold text-blue-600">85%</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ações da Equipe</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Performance Individual
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Definir Metas por Vendedor
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatório de Produtividade
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowTeamsDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Agendar Reunião */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Agendar Reunião
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Título da Reunião</Label>
              <Input id="meeting-title" placeholder="Ex: Revisão de Metas Mensais" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Data</Label>
              <Input id="meeting-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-time">Horário</Label>
              <Input id="meeting-time" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-participants">Participantes</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda equipe de vendas</SelectItem>
                  <SelectItem value="managers">Apenas gerentes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowMeetingDialog(false)}>
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}