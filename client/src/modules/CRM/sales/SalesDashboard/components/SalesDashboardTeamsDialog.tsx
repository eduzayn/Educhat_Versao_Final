import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Users, Target, BarChart3, ExternalLink, TrendingUp, Award, Calendar, Download } from "lucide-react";

interface SalesDashboardTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSalespeople: number;
}

export function SalesDashboardTeamsDialog({ 
  open, 
  onOpenChange,
  activeSalespeople
}: SalesDashboardTeamsDialogProps) {
  const [, setLocation] = useLocation();
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [showProductivityDialog, setShowProductivityDialog] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [period, setPeriod] = useState('month');

  // Buscar vendedores
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    },
    enabled: open
  });

  // Buscar dados de performance
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['/api/sales/charts', period],
    queryFn: async () => {
      const response = await fetch(`/api/sales/charts?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar performance');
      return response.json();
    },
    enabled: open
  });

  const handleViewPerformance = () => {
    setShowPerformanceDialog(true);
  };

  const handleDefineTargets = () => {
    onOpenChange(false);
    setLocation('/crm/sales?tab=targets');
  };

  const handleProductivityReport = () => {
    setShowProductivityDialog(true);
  };

  const handleExportReport = () => {
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      salesByPerson: performanceData?.salesByPerson || [],
      salesEvolution: performanceData?.salesEvolution || []
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio-produtividade-${period}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getSelectedPerformance = () => {
    if (!performanceData || selectedSalesperson === 'all') {
      return performanceData?.salesByPerson || [];
    }
    return performanceData.salesByPerson?.filter((person: any) => 
      person.name === selectedSalesperson
    ) || [];
  };

  const selectedData = getSelectedPerformance();
  const totalSales = selectedData.reduce((sum: number, person: any) => sum + person.value, 0);
  const totalDeals = selectedData.reduce((sum: number, person: any) => sum + person.deals, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                  {activeSalespeople}
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleViewPerformance}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Performance Individual
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleDefineTargets}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Definir Metas por Vendedor
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleProductivityReport}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatório de Produtividade
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Individual Dialog */}
      <Dialog open={showPerformanceDialog} onOpenChange={setShowPerformanceDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Performance Individual da Equipe
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {salespeople?.map((person: any) => (
                    <SelectItem key={person.id} value={person.name}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {totalSales.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Negócios</CardTitle>
                  <Award className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDeals}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {totalDeals > 0 ? Math.round(totalSales / totalDeals).toLocaleString('pt-BR') : '0'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando dados...
                </div>
              ) : selectedData.length > 0 ? (
                selectedData.map((person: any, index: number) => {
                  const percentage = totalSales > 0 ? (person.value / totalSales) * 100 : 0;
                  
                  return (
                    <div key={person.name} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{person.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            R$ {person.value.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {person.deals} negócios
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% do total da equipe
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado encontrado</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowPerformanceDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Relatório de Produtividade Dialog */}
      <Dialog open={showProductivityDialog} onOpenChange={setShowProductivityDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Relatório de Produtividade da Equipe
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    R$ {totalSales.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Negócios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{totalDeals}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    R$ {totalDeals > 0 ? Math.round(totalSales / totalDeals).toLocaleString('pt-BR') : '0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{selectedData.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="border-t border-gray-200 my-6" />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Análise de Produtividade Individual
              </h4>
              
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando dados...
                </div>
              ) : selectedData.length > 0 ? (
                <div className="space-y-3">
                  {selectedData
                    .sort((a: any, b: any) => b.value - a.value)
                    .map((person: any, index: number) => {
                      const personalTicket = person.deals > 0 ? person.value / person.deals : 0;
                      
                      return (
                        <Card key={person.name} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <span className="font-medium text-lg">{person.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                R$ {person.value.toLocaleString('pt-BR')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {person.deals} negócios
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Ticket Pessoal</div>
                              <div className="font-medium">
                                R$ {Math.round(personalTicket).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Participação</div>
                              <div className="font-medium">
                                {((person.value / totalSales) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de produtividade encontrado</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowProductivityDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 