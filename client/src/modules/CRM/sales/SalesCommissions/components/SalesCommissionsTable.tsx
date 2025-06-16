import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Commission } from '@/shared/lib/types/sales';

interface SalesCommissionsTableProps {
  commissions: Commission[];
}

export function SalesCommissionsTable({ commissions }: SalesCommissionsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paga</Badge>;
      default:
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento das Comissões</CardTitle>
      </CardHeader>
      <CardContent>
        {commissions.length > 0 ? (
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
              {commissions.map((commission) => (
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
                    {getStatusBadge(commission.status)}
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
  );
} 