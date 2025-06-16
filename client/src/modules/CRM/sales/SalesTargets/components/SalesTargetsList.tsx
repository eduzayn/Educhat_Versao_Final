import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Badge } from '@/shared/ui/badge';
import { Edit, Plus, Target } from 'lucide-react';
import { SalesTarget } from '@/shared/lib/types/sales';

interface SalesTargetsListProps {
  targets: SalesTarget[];
  canManageTargets: boolean;
  onEdit: (target: SalesTarget) => void;
  onCreate: () => void;
}

export function SalesTargetsList({ targets, canManageTargets, onEdit, onCreate }: SalesTargetsListProps) {
  const getStatusBadge = (target: SalesTarget) => {
    const achievement = (target.currentValue / target.targetValue) * 100;
    if (achievement >= 100) {
      return <Badge className="bg-green-100 text-green-800">Atingida</Badge>;
    } else if (achievement >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800">Próximo</Badge>;
    } else if (target.status === 'overdue') {
      return <Badge className="bg-red-100 text-red-800">Atrasada</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas por Vendedor</CardTitle>
      </CardHeader>
      <CardContent>
        {targets.length > 0 ? (
          <div className="space-y-4">
            {targets.map((target) => {
              const achievement = (target.currentValue / target.targetValue) * 100;
              return (
                <div key={target.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{target.salespersonName.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{target.salespersonName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {target.period} • {new Date(target.startDate).toLocaleDateString('pt-BR')} - {new Date(target.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(target)}
                      {canManageTargets && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(target)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meta: R$ {target.targetValue.toLocaleString('pt-BR')}</span>
                      <span>Atual: R$ {target.currentValue.toLocaleString('pt-BR')}</span>
                    </div>
                    <Progress value={Math.min(100, achievement)} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{achievement.toFixed(1)}% atingido</span>
                      <span>
                        {achievement >= 100 
                          ? `+R$ ${(target.currentValue - target.targetValue).toLocaleString('pt-BR')} acima da meta`
                          : `R$ ${(target.targetValue - target.currentValue).toLocaleString('pt-BR')} restante`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {canManageTargets 
                ? 'Comece criando metas para seus vendedores'
                : 'Nenhuma meta foi definida ainda'
              }
            </p>
            {canManageTargets && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 