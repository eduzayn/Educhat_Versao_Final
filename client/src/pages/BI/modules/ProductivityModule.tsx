import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Badge } from '../../badge';
import { getStatusBadge, getOnlineBadge } from '@/shared/lib/utils/badgeHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Input } from '../../input';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Clock, 
  MessageSquare, 
  Phone, 
  Activity,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Monitor,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatDurationMinutes, formatPercentage } from '@/shared/lib/utils/formatters';

export function ProductivityModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [period, setPeriod] = useState('today');

  // Buscar dados de produtividade
  const { data: productivityData, isLoading } = useQuery({
    queryKey: ['/api/bi/productivity', { period, team: selectedTeam, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedTeam !== 'all') params.append('team', selectedTeam);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/bi/productivity?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar dados de produtividade');
      return response.json();
    }
  });

  // Buscar equipes disponíveis
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

  const defaultData = productivityData || { users: [], summary: {} };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'idle': return 'Inativo';
      case 'offline': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };



  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

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

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Relatório Detalhado
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultData.summary?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {defaultData.summary?.totalUsers || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Logado</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatDurationMinutes(defaultData.summary?.avgLoggedTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              por colaborador
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Totais</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {defaultData.summary?.totalInteractions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              conversas processadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {defaultData.summary?.avgEfficiency?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              produtividade geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento Individual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {defaultData.users?.length > 0 ? (
              defaultData.users.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name || user.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.teamName || 'Sem equipe'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)}`}></div>
                      <Badge variant="secondary">
                        {getStatusText(user.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tempo Logado</div>
                      <div className="font-medium">
                        {formatDurationMinutes(user.loggedTime || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tempo Efetivo</div>
                      <div className="font-medium">
                        {formatDurationMinutes(user.activeTime || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Atendimentos</div>
                      <div className="font-medium">
                        {user.totalInteractions || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Mensagens</div>
                      <div className="font-medium">
                        {user.messagesSent || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Última Atividade</div>
                      <div className="font-medium">
                        {user.lastActivity ? 
                          new Date(user.lastActivity).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 
                          'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Barra de Eficiência */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Eficiência</span>
                      <span>{user.efficiency?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (user.efficiency || 0) >= 80 ? 'bg-green-500' :
                          (user.efficiency || 0) >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(user.efficiency || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {user.idleTime && user.idleTime > 10 && (
                    <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Inativo há {Math.round(user.idleTime)} minutos
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhum dado de produtividade disponível</p>
                <p className="text-sm">Dados serão exibidos quando os colaboradores estiverem ativos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}