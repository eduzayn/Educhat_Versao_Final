import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  Target, 
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

export function TeamPerformanceModule() {
  const [period, setPeriod] = useState('30');
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Buscar dados das equipes
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['/api/bi/teams', { period, team: selectedTeam }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedTeam !== 'all') params.append('team', selectedTeam);
      
      const response = await fetch(`/api/bi/teams?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar dados das equipes');
      return response.json();
    }
  });

  // Buscar lista de equipes
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = teamsData || { teams: [], summary: {} };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
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
            </SelectContent>
          </Select>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              {teams?.map((team: any) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes Ativas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {defaultData.summary?.activeTeams || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {defaultData.summary?.totalTeams || 0} equipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {defaultData.summary?.avgPerformance?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              todas as equipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Totais</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultData.summary?.totalInteractions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              todas as equipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {defaultData.summary?.avgSatisfaction?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              nota média geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Equipe */}
      <div className="space-y-4">
        {defaultData.teams?.length > 0 ? (
          defaultData.teams.map((team: any) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Macrosetor: {team.macrosetor || 'Não definido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(team.performanceScore || 0)}
                    <Badge variant="secondary" className={getPerformanceColor(team.performanceScore || 0)}>
                      {team.performanceScore?.toFixed(1) || '0.0'}% Performance
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Membros</div>
                    <div className="text-lg font-semibold">{team.memberCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Atendimentos</div>
                    <div className="text-lg font-semibold">{team.totalInteractions || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    <div className="text-lg font-semibold">
                      {formatTime(team.avgResponseTime || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Taxa Resolução</div>
                    <div className="text-lg font-semibold">
                      {team.resolutionRate?.toFixed(1) || '0.0'}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Satisfação</div>
                    <div className="text-lg font-semibold">
                      {team.satisfaction?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Negócios</div>
                    <div className="text-lg font-semibold">
                      <span className="text-green-600">{team.dealsWon || 0}</span> / 
                      <span className="text-red-600">{team.dealsLost || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de Performance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance Geral</span>
                    <span>{team.performanceScore?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        (team.performanceScore || 0) >= 80 ? 'bg-green-500' :
                        (team.performanceScore || 0) >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(team.performanceScore || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Top Performers da Equipe */}
                {team.topPerformers && team.topPerformers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Top Performers</h4>
                    <div className="flex flex-wrap gap-2">
                      {team.topPerformers.map((performer: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{performer.name}</span>
                          <Badge variant="outline" size="sm">
                            {performer.score?.toFixed(1) || '0.0'}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas da Equipe */}
                {team.alerts && team.alerts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Alertas</h4>
                    <div className="space-y-2">
                      {team.alerts.map((alert: any, index: number) => (
                        <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
                          alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                          alert.type === 'danger' ? 'bg-red-50 text-red-800' :
                          'bg-blue-50 text-blue-800'
                        }`}>
                          {alert.type === 'warning' && <XCircle className="h-4 w-4" />}
                          {alert.type === 'danger' && <XCircle className="h-4 w-4" />}
                          {alert.type === 'info' && <CheckCircle className="h-4 w-4" />}
                          <span className="text-sm">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-muted-foreground">
                Dados de equipes serão exibidos quando houver atividade no período selecionado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}