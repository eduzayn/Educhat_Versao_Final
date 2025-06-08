import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Button } from '../../button';
import { Badge } from '../../badge';
import { 
  BarChart3,
  Target,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Plus
} from "lucide-react";

export function CRMDashboard() {
  const kpis = {
    totalDeals: 24,
    totalValue: 95400,
    conversionRate: 18.5,
    avgDealTime: 12,
    totalContacts: 342,
    activeLeads: 89,
    companiesCount: 15,
    activitiesThisWeek: 67
  };

  const recentDeals = [
    {
      id: "1",
      name: "João Silva - Pós em Psicanálise",
      value: 1799,
      stage: "Proposta Enviada",
      contact: "João Silva",
      probability: 75
    },
    {
      id: "2", 
      name: "Maria Santos - MBA Executivo",
      value: 2400,
      stage: "Negociação",
      contact: "Maria Santos",
      probability: 85
    },
    {
      id: "3",
      name: "Pedro Costa - Curso Técnico",
      value: 899,
      stage: "Qualificado",
      contact: "Pedro Costa", 
      probability: 60
    }
  ];

  const recentActivities = [
    {
      id: "1",
      type: "call",
      description: "Ligação de follow-up com João Silva",
      time: "2 horas atrás",
      contact: "João Silva"
    },
    {
      id: "2",
      type: "email", 
      description: "Proposta enviada para Maria Santos",
      time: "4 horas atrás",
      contact: "Maria Santos"
    },
    {
      id: "3",
      type: "meeting",
      description: "Reunião agendada com Pedro Costa",
      time: "1 dia atrás",
      contact: "Pedro Costa"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {kpis.totalValue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão: {kpis.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeLeads}</div>
            <p className="text-xs text-muted-foreground">
              De {kpis.totalContacts} contatos totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.companiesCount}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.activitiesThisWeek} atividades esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negócios Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Negócios Recentes</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Novo Negócio
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{deal.name}</p>
                    <p className="text-xs text-muted-foreground">{deal.contact}</p>
                    <Badge variant="secondary" className="text-xs">
                      {deal.stage}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      R$ {deal.value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {deal.probability}% prob.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividades Recentes</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Nova Atividade
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <ActivityIcon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.contact} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">34</div>
              <p className="text-sm text-blue-600">Leads Qualificados</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">18</div>
              <p className="text-sm text-yellow-600">Propostas Enviadas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <p className="text-sm text-purple-600">Em Negociação</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <p className="text-sm text-green-600">Fechamentos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}