import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface DashboardMetricsProps {
  metrics: {
    activeConversations: number;
    newContacts: {
      week: number;
      today: number;
    };
    responseRate: number;
    averageResponseTime: number;
  };
  isLoading: boolean;
}

export function DashboardMetrics({ metrics, isLoading }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
      <Card className="border-l-4 border-l-educhat-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-educhat-medium">
            Conversas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-3xl font-bold text-gray-400">...</div>
          ) : (
            <div className="text-3xl font-bold text-educhat-dark">
              {metrics.activeConversations || 0}
            </div>
          )}
          <p className="text-xs text-blue-600 mt-2">Últimas 24 horas</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-educhat-medium">
            Novos Contatos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-3xl font-bold text-gray-400">...</div>
          ) : (
            <div className="text-3xl font-bold text-educhat-dark">
              {metrics.newContacts?.week || 0}
            </div>
          )}
          <p className="text-xs text-green-600 mt-2">
            {metrics.newContacts?.today || 0} hoje
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-educhat-medium">
            Taxa de Resposta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-3xl font-bold text-gray-400">...</div>
          ) : (
            <div className="text-3xl font-bold text-educhat-dark">
              {metrics.responseRate?.toFixed(1) || 0}%
            </div>
          )}
          <p className="text-xs text-orange-600 mt-2">
            {(metrics.responseRate || 0) < 50 ? 'Necessita atenção' : 'Boa performance'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-educhat-medium">
            Tempo Médio
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-3xl font-bold text-gray-400">...</div>
          ) : (
            <div className="text-3xl font-bold text-educhat-dark">
              {metrics.averageResponseTime 
                ? `${Math.round(metrics.averageResponseTime)}m`
                : 'N/A'
              }
            </div>
          )}
          <p className="text-xs text-orange-600 mt-2">Tempo de resposta</p>
        </CardContent>
      </Card>
    </div>
  );
} 