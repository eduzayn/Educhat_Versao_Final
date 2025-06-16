import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { PeriodFilter, StatusFilter, FilterContainer } from '@/shared/components/filters';
import { Download } from 'lucide-react';
import { SalesCommissionsStats } from './components/SalesCommissionsStats';
import { SalesCommissionsTable } from './components/SalesCommissionsTable';
import { SalesCommissionsSummary } from './components/SalesCommissionsSummary';
import { CommissionsData } from '@/shared/lib/types/sales';

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
    const rows = commissionsData.commissions.map((commission) => [
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

  const defaultData: CommissionsData = commissionsData || {
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

        <FilterContainer>
          <PeriodFilter
            value={period}
            onValueChange={setPeriod}
          />
          
          <StatusFilter
            value={status}
            onValueChange={setStatus}
            options={[
              { value: 'all', label: 'Todos Status' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'approved', label: 'Aprovadas' },
              { value: 'paid', label: 'Pagas' }
            ]}
          />

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
        </FilterContainer>
      </div>

      {/* Cards de Estatísticas */}
      <SalesCommissionsStats data={defaultData} />

      {/* Tabela de Comissões */}
      <SalesCommissionsTable commissions={defaultData.commissions} />

      {/* Resumo por Vendedor */}
      {defaultData.commissionsBySalesperson && (
        <SalesCommissionsSummary summaries={defaultData.commissionsBySalesperson} />
      )}
    </div>
  );
} 