import { useState } from "react";
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { 
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Video,
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react";

const mockActivities = [
  {
    id: "1",
    type: "call",
    title: "Ligação de follow-up",
    description: "Acompanhar proposta enviada para João Silva",
    contact: "João Silva",
    company: "Tech Solutions",
    date: "2025-06-04",
    time: "14:30",
    duration: "15 min",
    status: "completed",
    owner: "Ana Costa"
  },
  {
    id: "2",
    type: "meeting",
    title: "Reunião de apresentação",
    description: "Apresentar solução para equipe da Educação Moderna",
    contact: "Maria Santos",
    company: "Educação Moderna",
    date: "2025-06-05",
    time: "10:00",
    duration: "60 min",
    status: "scheduled",
    owner: "Carlos Silva"
  },
  {
    id: "3",
    type: "email",
    title: "Envio de proposta",
    description: "Enviar proposta comercial detalhada",
    contact: "Pedro Costa",
    company: "Saúde & Bem Estar",
    date: "2025-06-03",
    time: "16:45",
    duration: "5 min",
    status: "completed",
    owner: "Lucia Oliveira"
  },
  {
    id: "4",
    type: "task",
    title: "Preparar apresentação",
    description: "Criar slides para reunião com cliente",
    contact: "Ana Oliveira",
    company: "Consulta Individual",
    date: "2025-06-06",
    time: "09:00",
    duration: "120 min",
    status: "pending",
    owner: "Eduardo Santos"
  }
];

const activityTypes = {
  call: { icon: Phone, color: "bg-blue-500", label: "Ligação" },
  meeting: { icon: Video, color: "bg-green-500", label: "Reunião" },
  email: { icon: Mail, color: "bg-purple-500", label: "E-mail" },
  task: { icon: CheckCircle, color: "bg-orange-500", label: "Tarefa" },
  message: { icon: MessageSquare, color: "bg-cyan-500", label: "Mensagem" }
};

const statusMap = {
  completed: { label: "Concluída", variant: "default" as const },
  scheduled: { label: "Agendada", variant: "secondary" as const },
  pending: { label: "Pendente", variant: "outline" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const }
};

export function ActivitiesModule() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  const filtered = mockActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(search.toLowerCase()) ||
                         activity.contact.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || typeFilter === "all" || activity.type === typeFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || activity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getActivityIcon = (type: string) => {
    const ActivityIcon = activityTypes[type as keyof typeof activityTypes]?.icon || CheckCircle;
    return ActivityIcon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atividades</h2>
          <p className="text-muted-foreground">
            Gerencie tarefas, reuniões e acompanhamentos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Atividade
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            className="pl-9 w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="call">Ligações</SelectItem>
            <SelectItem value="meeting">Reuniões</SelectItem>
            <SelectItem value="email">E-mails</SelectItem>
            <SelectItem value="task">Tarefas</SelectItem>
            <SelectItem value="message">Mensagens</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> Mais Filtros
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mockActivities.length}</div>
            <p className="text-sm text-muted-foreground">Total de Atividades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockActivities.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockActivities.filter(a => a.status === 'scheduled').length}
            </div>
            <p className="text-sm text-muted-foreground">Agendadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {mockActivities.filter(a => a.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para visualização */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Lista de atividades */}
          <div className="space-y-4">
            {filtered.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const typeConfig = activityTypes[activity.type as keyof typeof activityTypes];
              const statusConfig = statusMap[activity.status as keyof typeof statusMap];

              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${typeConfig?.color} text-white`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{activity.contact}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(activity.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{activity.time}</span>
                          </div>
                          {activity.duration && (
                            <span>({activity.duration})</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Responsável: </span>
                            <span>{activity.owner}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
                            {activity.status === 'pending' && (
                              <Button size="sm">
                                Marcar como Concluída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">
                {search || typeFilter || statusFilter
                  ? "Nenhuma atividade encontrada com os filtros aplicados"
                  : "Nenhuma atividade cadastrada no sistema"
                }
              </div>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Criar Primeira Atividade
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualização em Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Visualização de calendário será implementada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}