import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Target,
  MessageSquare,
  FileText
} from "lucide-react";
import { CoachingStats } from '@/shared/lib/types/sales';

interface SalesCoachingStatsProps {
  stats: CoachingStats;
}

export function SalesCoachingStats({ stats }: SalesCoachingStatsProps) {
  const completionRate = stats.totalCoaching > 0 
    ? (stats.completedCoaching / stats.totalCoaching) * 100 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Taxa de Conclusão */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedCoaching} de {stats.totalCoaching} concluídos
          </p>
        </CardContent>
      </Card>

      {/* Tempo Médio de Resposta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageResponseTime}h</div>
          <p className="text-xs text-muted-foreground mt-2">
            Tempo médio para feedback
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            Conversão após coaching
          </p>
        </CardContent>
      </Card>

      {/* Volume de Vendas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Volume de Vendas</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {stats.salesVolume.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Vendas após coaching
          </p>
        </CardContent>
      </Card>

      {/* Distribuição por Tipo */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Feedback</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.byType.feedback}</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm">Metas</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.byType.goal}</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Treinamento</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.byType.training}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 