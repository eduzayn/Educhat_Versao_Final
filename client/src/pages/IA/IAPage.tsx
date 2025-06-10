import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { 
  Bot, 
  Brain, 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Settings,
  Upload,
  Zap,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function IAPage() {
  const [location, setLocation] = useLocation();
  
  // Mock data para demonstração
  const stats = {
    totalInteractions: 1247,
    leadsConverted: 89,
    avgResponseTime: 1.2,
    satisfactionRate: 94
  };

  const recentActivities = [
    {
      id: 1,
      type: 'conversion',
      contact: 'Maria Silva',
      course: 'Administração',
      timestamp: '10 min atrás',
      mode: 'consultant'
    },
    {
      id: 2,
      type: 'support',
      contact: 'João Santos',
      action: 'Certificado enviado',
      timestamp: '25 min atrás',
      mode: 'mentor'
    },
    {
      id: 3,
      type: 'handoff',
      contact: 'Ana Costa',
      reason: 'Questão complexa - Financeiro',
      timestamp: '1h atrás',
      mode: 'consultant'
    }
  ];

  const aiModes = [
    {
      title: 'Prof. Ana - Mentora Acadêmica',
      description: 'Apoio a alunos matriculados com foco em orientação e suporte',
      icon: Brain,
      color: 'bg-blue-100 text-blue-800',
      stats: { interactions: 678, satisfaction: 96 }
    },
    {
      title: 'Prof. Ana - Consultora Educacional', 
      description: 'Conversão de leads com abordagem persuasiva e orientada a vendas',
      icon: Zap,
      color: 'bg-green-100 text-green-800',
      stats: { interactions: 569, conversions: 89 }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-educhat-dark flex items-center gap-3">
              <Bot className="w-8 h-8 text-educhat-primary" />
              Prof. Ana
            </h1>
            <p className="text-educhat-medium mt-2">
              Assistente de Relacionamento Inteligente - Sistema de IA Educacional
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation('/ia/train')}>
              <Upload className="w-4 h-4 mr-2" />
              Treinar IA
            </Button>
            <Button variant="outline" onClick={() => setLocation('/ia/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-educhat-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-educhat-medium">
                Interações Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-educhat-dark">
                {stats.totalInteractions.toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +23% este mês
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-educhat-medium">
                Leads Convertidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-educhat-dark">
                {stats.leadsConverted}
              </div>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Taxa: 15.6%
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-educhat-medium">
                Tempo Médio de Resposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-educhat-dark">
                {stats.avgResponseTime}s
              </div>
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <Clock className="w-4 h-4 mr-1" />
                Excelente performance
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-educhat-medium">
                Satisfação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-educhat-dark">
                {stats.satisfactionRate}%
              </div>
              <div className="flex items-center mt-2 text-sm text-purple-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +2% este mês
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="modes">Modos de IA</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Modes Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Modos da Prof. Ana
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiModes.map((mode, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${mode.color}`}>
                            <mode.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{mode.title}</h3>
                            <p className="text-xs text-educhat-medium">{mode.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-educhat-medium">
                        <span>Interações: {mode.stats.interactions}</span>
                        {mode.stats.satisfaction && (
                          <span>Satisfação: {mode.stats.satisfaction}%</span>
                        )}
                        {mode.stats.conversions && (
                          <span>Conversões: {mode.stats.conversions}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-educhat-primary"></div>
                        <div>
                          <p className="text-sm font-medium">{activity.contact}</p>
                          <p className="text-xs text-educhat-medium">
                            {activity.course || activity.action || activity.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {activity.mode === 'mentor' ? 'Mentora' : 'Consultora'}
                        </Badge>
                        <p className="text-xs text-educhat-medium mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiModes.map((mode, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${mode.color}`}>
                        <mode.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg">{mode.title}</h3>
                        <p className="text-sm text-educhat-medium font-normal">
                          {mode.description}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-educhat-dark">
                          {mode.stats.interactions}
                        </div>
                        <div className="text-xs text-educhat-medium">Interações</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-educhat-dark">
                          {mode.stats.satisfaction || mode.stats.conversions}
                        </div>
                        <div className="text-xs text-educhat-medium">
                          {mode.stats.satisfaction ? 'Satisfação %' : 'Conversões'}
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar Modo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log de Atividades da IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="border-l-4 border-l-educhat-primary pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activity.contact}</p>
                          <p className="text-sm text-educhat-medium">
                            {activity.course || activity.action || activity.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {activity.mode === 'mentor' ? 'Mentora' : 'Consultora'}
                          </Badge>
                          <p className="text-xs text-educhat-medium mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance por Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-educhat-medium">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Gráficos de performance em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Distribuição por Funil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-educhat-medium">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Análise de funis em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}