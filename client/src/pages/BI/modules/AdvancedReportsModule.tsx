import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { 
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Clock,
  Phone,
  Instagram,
  Facebook,
  Mail,
  Calendar,
  Filter,
  Save,
  Share
} from 'lucide-react';

export function AdvancedReportsModule() {
  const [reportType, setReportType] = useState('channels');
  const [period, setPeriod] = useState('30');
  const [format, setFormat] = useState('xlsx');

  // Buscar dados dos relatórios
  const { data: channelReports, isLoading: channelLoading } = useQuery({
    queryKey: ['/api/bi/reports/channels', period],
    queryFn: async () => {
      const response = await fetch(`/api/bi/reports/channels?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar relatório de canais');
      return response.json();
    }
  });

  const { data: funnelReports, isLoading: funnelLoading } = useQuery({
    queryKey: ['/api/bi/reports/funnel', period],
    queryFn: async () => {
      const response = await fetch(`/api/bi/reports/funnel?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar relatório de funil');
      return response.json();
    }
  });

  const { data: macrosetorReports, isLoading: macrosetorLoading } = useQuery({
    queryKey: ['/api/bi/reports/macrosetor', period],
    queryFn: async () => {
      const response = await fetch(`/api/bi/reports/macrosetor?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar relatório de macrosetor');
      return response.json();
    }
  });

  const { data: retentionReports, isLoading: retentionLoading } = useQuery({
    queryKey: ['/api/bi/reports/retention', period],
    queryFn: async () => {
      const response = await fetch(`/api/bi/reports/retention?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar relatório de retenção');
      return response.json();
    }
  });

  const handleExportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/bi/export/${type}?period=${period}&format=${format}`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Erro ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp': return <Phone className="h-4 w-4 text-green-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-500" />;
      case 'email': return <Mail className="h-4 w-4 text-gray-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes tipos de relatório */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
          <TabsTrigger value="macrosetor">Macrosetores</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
        </TabsList>

        {/* Relatório por Canal */}
        <TabsContent value="channels" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Relatório por Canal</h3>
            <Button onClick={() => handleExportReport('channels')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelReports?.channels?.map((channel: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel.name)}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {channel.conversionRate?.toFixed(1)}% conversão
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Contatos</div>
                          <div className="font-semibold">{channel.totalContacts || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Mensagens</div>
                          <div className="font-semibold">{channel.totalMessages || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Tempo Médio</div>
                          <div className="font-semibold">{channel.avgResponseTime || 0}min</div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum dado de canal disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Gráfico de evolução temporal será implementado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório de Funil de Vendas */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Funil de Vendas</h3>
            <Button onClick={() => handleExportReport('funnel')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelReports?.stages?.map((stage: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stage.name}</span>
                        <div className="text-right">
                          <div className="font-semibold">{stage.count || 0}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.conversionRate?.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${stage.conversionRate || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tempo médio na etapa: {stage.avgTime || 0} dias
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum dado de funil disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Perdas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {funnelReports?.lostDeals || 0}
                      </div>
                      <div className="text-sm text-red-600">Negócios Perdidos</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {funnelReports?.wonDeals || 0}
                      </div>
                      <div className="text-sm text-green-600">Negócios Ganhos</div>
                    </div>
                  </div>
                  
                  {funnelReports?.lossReasons && (
                    <div>
                      <h4 className="font-medium mb-2">Principais Motivos de Perda</h4>
                      <div className="space-y-2">
                        {funnelReports.lossReasons.map((reason: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{reason.reason}</span>
                            <span className="font-medium">{reason.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório por Macrosetor */}
        <TabsContent value="macrosetor" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Análise por Macrosetor</h3>
            <Button onClick={() => handleExportReport('macrosetor')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {macrosetorReports?.sectors?.map((sector: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{sector.name}</h4>
                          <p className="text-sm text-muted-foreground">{sector.description}</p>
                        </div>
                        <Badge variant={sector.status === 'above_target' ? 'default' : 'secondary'}>
                          {sector.status === 'above_target' ? 'Acima da Meta' : 'Abaixo da Meta'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Leads Gerados</div>
                          <div className="font-semibold">{sector.leadsGenerated || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Taxa Conversão</div>
                          <div className="font-semibold">{sector.conversionRate?.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sem Resposta</div>
                          <div className="font-semibold">{sector.noResponse || 0}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Meta: {sector.target || 0}%</span>
                          <span>Atual: {sector.conversionRate?.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (sector.conversionRate || 0) >= (sector.target || 0) ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((sector.conversionRate || 0) / (sector.target || 100) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum dado de macrosetor disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Gráfico comparativo de metas será implementado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório de Retenção */}
        <TabsContent value="retention" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Análise de Retenção</h3>
            <Button onClick={() => handleExportReport('retention')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Retenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {retentionReports?.retentionRate?.toFixed(1) || '0.0'}%
                    </div>
                    <p className="text-muted-foreground">Taxa de Retenção Geral</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {retentionReports?.returningCustomers || 0}
                      </div>
                      <div className="text-sm text-green-600">Retornaram</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">
                        {retentionReports?.churnedCustomers || 0}
                      </div>
                      <div className="text-sm text-red-600">Desistiram</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Análise temporal de retenção será implementada
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}