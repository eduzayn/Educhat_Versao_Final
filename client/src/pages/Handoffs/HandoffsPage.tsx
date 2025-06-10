import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  User,
  Zap,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Handoff } from '@shared/schema';

interface HandoffWithDetails extends Handoff {
  conversation?: {
    id: number;
    contactName: string;
    phone: string;
  };
  fromUser?: {
    id: number;
    displayName: string;
  };
  toUser?: {
    id: number;
    displayName: string;
  };
  fromTeam?: {
    id: number;
    name: string;
    color: string;
  };
  toTeam?: {
    id: number;
    name: string;
    color: string;
  };
}

interface HandoffStats {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export function HandoffsPage() {
  const { toast } = useToast();
  const [handoffs, setHandoffs] = useState<HandoffWithDetails[]>([]);
  const [stats, setStats] = useState<HandoffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [handoffsResponse, statsResponse] = await Promise.all([
        fetch('/api/handoffs'),
        fetch('/api/handoffs/stats')
      ]);

      if (handoffsResponse.ok) {
        const handoffsData = await handoffsResponse.json();
        setHandoffs(handoffsData.handoffs || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de handoffs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHandoff = async (handoffId: number) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 57 }) // TODO: Get current user ID
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Handoff aceito com sucesso"
        });
        await loadData();
      } else {
        throw new Error('Erro ao aceitar handoff');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o handoff",
        variant: "destructive"
      });
    }
  };

  const handleRejectHandoff = async (handoffId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Handoff rejeitado com sucesso"
        });
        await loadData();
      } else {
        throw new Error('Erro ao rejeitar handoff');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o handoff",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'automatic': return <Zap className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const filteredHandoffs = handoffs.filter(handoff => {
    switch (activeTab) {
      case 'pending': return handoff.status === 'pending';
      case 'completed': return handoff.status === 'completed';
      case 'rejected': return handoff.status === 'rejected';
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Handoffs</h1>
            <p className="text-gray-600">Gerencie transferências de conversas inteligentes</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600">Handoffs totais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-600">Aguardando ação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-gray-600">Transferências realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-gray-600">Transferências recusadas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Handoffs */}
      <Card>
        <CardHeader>
          <CardTitle>Handoffs Recentes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as transferências de conversas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="completed">Concluídos</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredHandoffs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum handoff encontrado para esta categoria
                  </div>
                ) : (
                  filteredHandoffs.map((handoff) => (
                    <div
                      key={handoff.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(handoff.type)}
                            <span className="font-medium">
                              Conversa #{handoff.conversationId}
                            </span>
                            <Badge variant="outline" className={getStatusColor(handoff.status)}>
                              {handoff.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(handoff.priority || 'normal')}>
                              {handoff.priority || 'normal'}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {handoff.reason || 'Sem motivo especificado'}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>De:</span>
                              {handoff.fromTeam ? (
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: handoff.fromTeam.color + '20',
                                    color: handoff.fromTeam.color
                                  }}
                                >
                                  {handoff.fromTeam.name}
                                </Badge>
                              ) : handoff.fromUser ? (
                                <span>{handoff.fromUser.displayName}</span>
                              ) : (
                                <span className="text-gray-400">Não especificado</span>
                              )}
                            </div>

                            <ArrowRight className="h-3 w-3" />

                            <div className="flex items-center gap-1">
                              <span>Para:</span>
                              {handoff.toTeam ? (
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: handoff.toTeam.color + '20',
                                    color: handoff.toTeam.color
                                  }}
                                >
                                  {handoff.toTeam.name}
                                </Badge>
                              ) : handoff.toUser ? (
                                <span>{handoff.toUser.displayName}</span>
                              ) : (
                                <span className="text-gray-400">Não especificado</span>
                              )}
                            </div>

                            <div className="ml-auto">
                              {handoff.createdAt ? new Date(handoff.createdAt).toLocaleString('pt-BR') : '-'}
                            </div>
                          </div>

                          {handoff.aiClassification && (
                            <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                              <div className="font-medium text-purple-700 mb-1">Análise IA:</div>
                              <div className="text-purple-600">
                                Intenção: {handoff.aiClassification.intent} • 
                                Urgência: {handoff.aiClassification.urgency} • 
                                Confiança: {handoff.aiClassification.confidence}%
                              </div>
                            </div>
                          )}
                        </div>

                        {handoff.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcceptHandoff(handoff.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectHandoff(handoff.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}