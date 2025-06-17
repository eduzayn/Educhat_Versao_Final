import { useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, CalendarDays } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PeriodFilter, ChannelFilter, FilterContainer } from '@/shared/components/filters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useQuery } from '@tanstack/react-query';
export function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [channel, setChannel] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');

  // Buscar dados dos relatórios
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports/analytics', period, channel],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        channel,
        ...(customDateRange.start && customDateRange.end && {
          startDate: customDateRange.start,
          endDate: customDateRange.end
        })
      });
      const response = await fetch(`/api/reports/analytics?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar relatórios');
      return response.json();
    }
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        period,
        channel,
        format: exportFormat,
        ...(customDateRange.start && customDateRange.end && {
          startDate: customDateRange.start,
          endDate: customDateRange.end
        })
      });
      
      const response = await fetch(`/api/reports/export?${params}`);
      if (!response.ok) throw new Error('Erro ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  const handleCustomPeriod = () => {
    if (customDateRange.start && customDateRange.end) {
      setPeriod('custom');
      setShowCustomPeriod(false);
      alert(`Período personalizado aplicado: ${customDateRange.start} até ${customDateRange.end}`);
    }
  };

  const metrics = reportData?.metrics || {
    totalConversations: 0,
    messagesSent: 0,
    avgResponseTime: 0,
    resolutionRate: 0,
    conversationGrowth: 0,
    messagesGrowth: 0,
    responseTimeGrowth: 0,
    resolutionGrowth: 0
  };
  return (
    <div className="h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-educhat-dark flex items-center">
                  <BarChart3 className="w-8 h-8 mr-3 text-educhat-primary" />
                  Relatórios e Analytics
                </h1>
                <p className="text-educhat-medium mt-2">
                  Análise detalhada de conversas, agentes e performance
                </p>
              </div>
              <div className="flex space-x-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Exportar Relatório</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="format">Formato do arquivo</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                            <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleExport} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Relatório
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCustomPeriod} onOpenChange={setShowCustomPeriod}>
                  <DialogTrigger asChild>
                    <Button className="bg-educhat-primary hover:bg-educhat-secondary">
                      <Calendar className="w-4 h-4 mr-2" />
                      Período
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Selecionar Período Personalizado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="start-date">Data de início</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">Data de fim</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                      <Button 
                        onClick={handleCustomPeriod} 
                        className="w-full"
                        disabled={!customDateRange.start || !customDateRange.end}
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Aplicar Período
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <FilterContainer 
            className="mb-8"
            showMoreFilters={true}
            onMoreFilters={() => console.log('Mais filtros')}
          >
            <PeriodFilter
              value={period}
              onValueChange={setPeriod}
              className="w-48"
            />

            <ChannelFilter
              value={channel}
              onValueChange={setChannel}
              className="w-48"
            />
          </FilterContainer>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Total de Conversas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">
                  {isLoading ? '...' : metrics.totalConversations.toLocaleString()}
                </div>
                <div className={`flex items-center text-xs mt-1 ${
                  metrics.conversationGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.conversationGrowth >= 0 ? '+' : ''}{metrics.conversationGrowth}% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Mensagens Enviadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">
                  {isLoading ? '...' : metrics.messagesSent.toLocaleString()}
                </div>
                <div className={`flex items-center text-xs mt-1 ${
                  metrics.messagesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.messagesGrowth >= 0 ? '+' : ''}{metrics.messagesGrowth}% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Tempo Médio de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">
                  {isLoading ? '...' : `${metrics.avgResponseTime}min`}
                </div>
                <div className={`flex items-center text-xs mt-1 ${
                  metrics.responseTimeGrowth <= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.responseTimeGrowth >= 0 ? '+' : ''}{metrics.responseTimeGrowth}% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-educhat-medium">
                  Taxa de Resolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-educhat-dark">
                  {isLoading ? '...' : `${metrics.resolutionRate}%`}
                </div>
                <div className={`flex items-center text-xs mt-1 ${
                  metrics.resolutionGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.resolutionGrowth >= 0 ? '+' : ''}{metrics.resolutionGrowth}% vs período anterior
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Conversas */}
            <Card>
              <CardHeader>
                <CardTitle>Conversas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Gráfico será implementado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canais Mais Utilizados */}
            <Card>
              <CardHeader>
                <CardTitle>Canais Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Análise de canais será implementada
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance dos Agentes */}
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Relatórios em desenvolvimento
                </h3>
                <p className="text-gray-500 mb-6">
                  Em breve você terá acesso a relatórios detalhados sobre performance, métricas de agentes e análises avançadas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Métricas de Conversas</h4>
                    <p className="text-sm text-blue-700">Volume, duração e resolução</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Performance de Agentes</h4>
                    <p className="text-sm text-green-700">Tempo de resposta e qualidade</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Análise de Canais</h4>
                    <p className="text-sm text-purple-700">Eficiência por plataforma</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;