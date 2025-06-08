import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Badge } from '../../badge';
import { getStatusBadge } from '@/shared/lib/utils/badgeHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Textarea } from '../../textarea';
import { useQuery } from '@tanstack/react-query';
import { 
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Heart,
  Frown,
  Meh,
  Smile
} from 'lucide-react';

export function SatisfactionModule() {
  const [period, setPeriod] = useState('30');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Buscar dados de satisfação
  const { data: satisfactionData, isLoading } = useQuery({
    queryKey: ['/api/bi/satisfaction', { period, team: selectedTeam, channel: selectedChannel }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedTeam !== 'all') params.append('team', selectedTeam);
      if (selectedChannel !== 'all') params.append('channel', selectedChannel);
      
      const response = await fetch(`/api/bi/satisfaction?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar dados de satisfação');
      return response.json();
    }
  });

  // Buscar equipes e canais
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    }
  });

  const { data: channels } = useQuery({
    queryKey: ['/api/channels'],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      if (!response.ok) throw new Error('Erro ao carregar canais');
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

  const defaultData = satisfactionData || {
    overall: {},
    byAgent: [],
    byChannel: [],
    byTeam: [],
    recent: [],
    trends: {}
  };

  const getSatisfactionIcon = (rating: number) => {
    if (rating >= 8) return <Smile className="h-5 w-5 text-green-500" />;
    if (rating >= 6) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
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

          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              {channels?.map((channel: any) => (
                <SelectItem key={channel.id} value={channel.id.toString()}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSAT
        </Button>
      </div>

      {/* KPIs de Satisfação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSAT Geral</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {defaultData.overall?.avgRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center mt-1">
              {renderStars(defaultData.overall?.avgRating || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {defaultData.overall?.totalResponses || 0} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfeitos</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultData.overall?.satisfiedCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {defaultData.overall?.satisfiedPercentage?.toFixed(1) || '0.0'}% dos atendimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insatisfeitos</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {defaultData.overall?.unsatisfiedCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {defaultData.overall?.unsatisfiedPercentage?.toFixed(1) || '0.0'}% dos atendimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {defaultData.overall?.responseRate?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              dos atendimentos avaliados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfação por Colaborador */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfação por Colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultData.byAgent?.length > 0 ? (
                defaultData.byAgent.map((agent: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.totalEvaluations || 0} avaliações
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getSatisfactionColor(agent.avgRating || 0)}`}>
                        {agent.avgRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex items-center">
                        {renderStars(agent.avgRating || 0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma avaliação disponível</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Satisfação por Canal */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfação por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultData.byChannel?.length > 0 ? (
                defaultData.byChannel.map((channel: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getSatisfactionIcon(channel.avgRating || 0)}
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${getSatisfactionColor(channel.avgRating || 0)}`}>
                          {channel.avgRating?.toFixed(1) || '0.0'}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {channel.totalEvaluations || 0} avaliações
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (channel.avgRating || 0) >= 8 ? 'bg-green-500' :
                          (channel.avgRating || 0) >= 6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(channel.avgRating || 0) * 10}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma avaliação por canal disponível</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfação por Equipe */}
      <Card>
        <CardHeader>
          <CardTitle>Performance das Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultData.byTeam?.length > 0 ? (
              defaultData.byTeam.map((team: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{team.name}</h4>
                    <Badge variant="secondary">
                      {team.macrosetor || 'Geral'}
                    </Badge>
                  </div>
                  
                  <div className="text-center mb-3">
                    <div className={`text-2xl font-bold ${getSatisfactionColor(team.avgRating || 0)}`}>
                      {team.avgRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="flex items-center justify-center">
                      {renderStars(team.avgRating || 0)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avaliações:</span>
                      <span className="font-medium">{team.totalEvaluations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Satisfeitos:</span>
                      <span className="font-medium text-green-600">
                        {team.satisfiedCount || 0} ({team.satisfiedPercentage?.toFixed(1) || '0.0'}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insatisfeitos:</span>
                      <span className="font-medium text-red-600">
                        {team.unsatisfiedCount || 0} ({team.unsatisfiedPercentage?.toFixed(1) || '0.0'}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma avaliação por equipe disponível</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avaliações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {defaultData.recent?.length > 0 ? (
              defaultData.recent.map((evaluation: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        {renderStars(evaluation.rating || 0)}
                      </div>
                      <div>
                        <div className="font-medium">{evaluation.contactName || 'Cliente Anônimo'}</div>
                        <div className="text-sm text-muted-foreground">
                          Atendido por: {evaluation.agentName || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <Badge variant="outline">
                        {evaluation.channel || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  
                  {evaluation.comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{evaluation.comment}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma avaliação recente encontrada</p>
                <p className="text-sm">Avaliações aparecerão aqui quando clientes responderem às pesquisas de satisfação</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}