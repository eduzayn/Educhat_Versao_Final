import { useState } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { PeriodFilter, ChannelFilter, FilterContainer } from '@/shared/components/filters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { useQuery } from '@tanstack/react-query';
import { ConversationsPeriodChart } from './ConversationsPeriodChart';
import { ChannelsUsageChart } from './ChannelsUsageChart';

export function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [channel, setChannel] = useState('all');
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);

  // Handler para mudança do período
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomDateDialog(true);
    }
  };

  // Handler para aplicar datas customizadas
  const handleApplyCustomDates = () => {
    if (customStartDate && customEndDate) {
      setShowCustomDateDialog(false);
    }
  };

  // Buscar dados dos relatórios
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports/analytics', period, channel],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        channel
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
        format: exportFormat
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
              </div>
            </div>
          </div>

          {/* Filtros */}
          <FilterContainer spacing="md">
            <PeriodFilter 
              value={period} 
              onValueChange={handlePeriodChange} 
              size="sm"
              className="w-36"
            />
            <ChannelFilter 
              value={channel} 
              onValueChange={setChannel} 
              size="sm"
              className="w-36"
            />
          </FilterContainer>

          {/* Métricas */}
          <div className="mt-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.messagesSent}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics.messagesGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics.messagesGrowth >= 0 ? '+' : ''}{metrics.messagesGrowth}%
                  </span>
                  {' '}vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgResponseTime}min</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics.responseTimeGrowth <= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics.responseTimeGrowth >= 0 ? '+' : ''}{metrics.responseTimeGrowth}%
                  </span>
                  {' '}vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.resolutionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics.resolutionGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics.resolutionGrowth >= 0 ? '+' : ''}{metrics.resolutionGrowth}%
                  </span>
                  {' '}vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalConversations}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics.conversationGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics.conversationGrowth >= 0 ? '+' : ''}{metrics.conversationGrowth}%
                  </span>
                  {' '}vs período anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversationsPeriodChart period={period} channel={channel} />
            <ChannelsUsageChart period={period} />
          </div>
        </div>
      </div>

      {/* Modal de Período Personalizado */}
      <Dialog open={showCustomDateDialog} onOpenChange={setShowCustomDateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Período Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomDateDialog(false);
                  setPeriod('30');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleApplyCustomDates}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}