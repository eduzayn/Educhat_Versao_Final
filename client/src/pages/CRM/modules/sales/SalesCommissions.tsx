import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { getCommissionStatusBadge } from '@/shared/lib/utils/badgeHelpers';
import { formatCurrency, formatPercentage } from '@/shared/lib/utils/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { 
  Download, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface Commission {
  id: number;
  salespersonId: number;
  salespersonName: string;
  dealId: number;
  dealValue: number;
  commissionRate: number;
  commissionValue: number;
  status: 'pending' | 'approved' | 'paid';
  dealClosedAt: string;
  paidAt?: string;
}

export function SalesCommissions() {
  const [period, setPeriod] = useState('month');
  const [status, setStatus] = useState('all');
  const [salesperson, setSalesperson] = useState('all');

  // Buscar dados de comissões
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ['/api/sales/commissions', { period, status, salesperson }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/commissions?period=${period}&status=${status}&salesperson=${salesperson}`);
      if (!response.ok) throw new Error('Erro ao carregar comissões');
      return response.json();
    }
  });

  // Buscar vendedores para filtro
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });



  const handleExportCSV = () => {
    if (!commissionsData?.commissions) return;
    
    const headers = ['Vendedor', 'Negócio', 'Valor da Venda', 'Taxa %', 'Comissão', 'Status', 'Data Fechamento'];
    const rows = commissionsData.commissions.map((commission: Commission) => [
      commission.salespersonName,
      `#${commission.dealId}`,
      `R$ ${commission.dealValue.toLocaleString('pt-BR')}`,
      `${commission.commissionRate}%`,
      `R$ ${commission.commissionValue.toLocaleString('pt-BR')}`,
      commission.status,
      new Date(commission.dealClosedAt).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comissoes_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = commissionsData || {
    totalCommissions: 0,
    totalPending: 0,
    totalPaid: 0,
    totalSales: 0,
    commissions: []
  };

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Comissões de Vendas</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe as comissões da equipe</p>
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

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
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

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {defaultData.totalCommissions?.toLocaleString('pt-BR') || '0'}
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
              R$ {defaultData.totalPending?.toLocaleString('pt-BR') || '0'}
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
              R$ {defaultData.totalPaid?.toLocaleString('pt-BR') || '0'}
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
              R$ {defaultData.totalSales?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {defaultData.totalSales > 0 
                ? `${((defaultData.totalCommissions / defaultData.totalSales) * 100).toFixed(1)}% em comissões`
                : 'Base para comissões'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {defaultData.commissions?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Valor da Venda</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaultData.commissions.map((commission: Commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {commission.salespersonName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{commission.salespersonName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">#{commission.dealId}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {commission.dealValue.toLocaleString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{commission.commissionRate}%</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        R$ {commission.commissionValue.toLocaleString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const badgeConfig = getCommissionStatusBadge(commission.status);
                        const IconComponent = commission.status === 'pending' ? Clock : 
                                            commission.status === 'approved' ? CheckCircle : 
                                            commission.status === 'paid' ? CheckCircle : XCircle;
                        return (
                          <Badge variant={badgeConfig.variant} className={badgeConfig.color}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {badgeConfig.text}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {new Date(commission.dealClosedAt).toLocaleDateString('pt-BR')}
                        </div>
                        {commission.paidAt && (
                          <div className="text-xs text-muted-foreground">
                            Paga em {new Date(commission.paidAt).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-muted-foreground">
                As comissões aparecerão aqui quando negócios forem fechados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo por Vendedor */}
      {defaultData.commissionsBySalesperson?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultData.commissionsBySalesperson.map((summary: any) => (
                <div key={summary.salespersonId} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {summary.salespersonName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{summary.salespersonName}</h4>
                      <p className="text-sm text-muted-foreground">{summary.totalDeals} negócios</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendas:</span>
                      <span className="font-medium">R$ {summary.totalSales.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Comissões:</span>
                      <span className="font-bold text-green-600">R$ {summary.totalCommissions.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa média:</span>
                      <span className="text-sm">{summary.averageRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}