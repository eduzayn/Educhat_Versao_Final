import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Target, Users, Calendar } from "lucide-react";

interface SummaryData {
  salesByPerson: any[];
  maxValue: number;
  distributionByType: any[];
}

interface SalesDashboardSummaryProps {
  data: SummaryData;
  onGoalsClick: () => void;
  onTeamsClick: () => void;
  onMeetingClick: () => void;
}

export function SalesDashboardSummary({ 
  data, 
  onGoalsClick, 
  onTeamsClick, 
  onMeetingClick 
}: SalesDashboardSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Rápido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Vendedores ativos</span>
          <Badge variant="outline">{data.salesByPerson?.length || 0}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Maior venda</span>
          <span className="text-sm font-medium">
            R$ {data.maxValue?.toLocaleString('pt-BR') || '0'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Canais ativos</span>
          <Badge variant="outline">{data.distributionByType?.length || 0}</Badge>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Ações Rápidas</h4>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={onGoalsClick}
            >
              <Target className="h-4 w-4 mr-2" />
              Definir Metas
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={onTeamsClick}
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Equipe
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={onMeetingClick}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Reunião
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 