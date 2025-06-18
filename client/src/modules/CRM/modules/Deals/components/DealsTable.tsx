import React from "react";
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { MoreHorizontal, Edit, Trash, Phone, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import type { Deal } from '@shared/schema';

interface DealsTableProps {
  deals: Deal[];
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal?: (dealId: number) => void;
  isLoading?: boolean;
}

export function DealsTable({ deals, onEditDeal, onDeleteDeal, isLoading }: DealsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'Prospecção': 'bg-blue-100 text-blue-800',
      'Qualificado': 'bg-purple-100 text-purple-800',
      'Proposta': 'bg-orange-100 text-orange-800',
      'Negociação': 'bg-yellow-100 text-yellow-800',
      'Fechado': 'bg-green-100 text-green-800',
      'Perdido': 'bg-red-100 text-red-800'
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Negócio</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estágio</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum negócio encontrado
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{deal.name}</div>
                      <div className="text-sm text-muted-foreground">{deal.notes}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{deal.clientName || deal.name}</div>
                      {deal.clientEmail && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {deal.clientEmail}
                        </div>
                      )}
                      {deal.clientPhone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {deal.clientPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(deal.stage || 'Prospecção')}>
                      {deal.stage || 'Prospecção'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deal.value ? formatCurrency(deal.value) : '-'}
                  </TableCell>
                  <TableCell>
                    {deal.createdAt ? formatDate(deal.createdAt.toString()) : '-'}
                  </TableCell>
                  <TableCell>
                    {deal.assignedUserId ? `Usuário ${deal.assignedUserId}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditDeal(deal)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {onDeleteDeal && (
                          <DropdownMenuItem 
                            onClick={() => onDeleteDeal(deal.id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}