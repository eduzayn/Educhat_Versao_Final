import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getStatusBadge, getChannelBadge } from '@/shared/lib/utils/badgeHelpers';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Target, 
  Star,
  Phone,
  Mail,
  Instagram,
  Facebook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';

export function BIDashboard() {
  const [period, setPeriod] = useState('30');
  const [equipe, setEquipe] = useState('all');
  const [channel, setChannel] = useState('all');

  // Buscar dados reais do sistema
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['/api/bi/kpis', { period, equipe, channel }],
    queryFn: async () => {
      const response = await fetch(`/api/bi/kpis?period=${period}&equipe=${equipe}&channel=${channel}`);
      if (!response.ok) throw new Error('Erro ao carregar KPIs');
      return response.json();
    }
  });

  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/bi/channels', { period }],
    queryFn: async () => {
      const response = await fetch(`/api/bi/channels?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar dados dos canais');
      return response.json();
    }
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['/api/bi/teams', { period }],
    queryFn: async () => {
      const response = await fetch(`/api/bi/teams?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar dados das equipes');
      return response.json();
    }
  });

  if (kpiLoading || channelsLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultKpiData = kpiData || {
    totalAtendimentos: 0,
    novosContatos: 0,
    taxaConversao: 0,
    taxaDesistencia: 0,
    satisfacaoMedia: 0,
    tempoMedioResposta: 0,
    tempoMedioResolucao: 0
  };

  const defaultChannelsData = channelsData || [];
  const defaultTeamData = teamData || [];

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
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={equipe} onValueChange={setEquipe}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
              <SelectItem value="cobranca">Cobrança</SelectItem>
              <SelectItem value="secretaria">Secretaria</SelectItem>
              <SelectItem value="tutoria">Tutoria</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultKpiData.totalAtendimentos?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Conversas processadas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Contatos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {defaultKpiData.novosContatos?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads gerados no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {defaultKpiData.taxaConversao?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conversões por macrosetor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Desistência</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {defaultKpiData.taxaDesistencia?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Abandono de conversas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {defaultKpiData.satisfacaoMedia?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Nota média dos atendimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {defaultKpiData.tempoMedioResposta ? `${Math.round(defaultKpiData.tempoMedioResposta)}m` : '0m'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo para primeira resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultKpiData.tempoMedioResolucao ? `${Math.round(defaultKpiData.tempoMedioResolucao / 60)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de resolução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canais de Comunicação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Canais de Comunicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultChannelsData.length > 0 ? (
                defaultChannelsData.map((canal: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {canal.tipo === 'whatsapp' && <Phone className="h-5 w-5 text-green-500" />}
                      {canal.tipo === 'instagram' && <Instagram className="h-5 w-5 text-pink-500" />}
                      {canal.tipo === 'facebook' && <Facebook className="h-5 w-5 text-blue-500" />}
                      {canal.tipo === 'email' && <Mail className="h-5 w-5 text-gray-500" />}
                      <div>
                        <div className="font-medium">{canal.nome}</div>
                        <div className="text-sm text-muted-foreground">{canal.tipo}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{canal.atendimentos || 0}</div>
                      <div className="text-sm text-muted-foreground">atendimentos</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado de canal disponível para o período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultTeamData.length > 0 ? (
                defaultTeamData.map((equipe: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{equipe.nome}</span>
                      <Badge variant="secondary">
                        {equipe.atendimentos || 0} atendimentos
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Conversão: {equipe.conversao?.toFixed(1) || '0.0'}%</span>
                      <span>Satisfação: {equipe.satisfacao?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${equipe.conversao || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado de equipe disponível para o período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}