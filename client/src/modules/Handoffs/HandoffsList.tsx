import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { 
  Clock, 
  User, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface HandoffsListProps {
  handoffs: HandoffWithDetails[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleAcceptHandoff: (handoffId: number) => void;
  handleRejectHandoff: (handoffId: number, reason?: string) => void;
}

export function HandoffsList({
  handoffs,
  activeTab,
  setActiveTab,
  handleAcceptHandoff,
  handleRejectHandoff
}: HandoffsListProps) {
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente', icon: Clock },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Aceito', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeitado', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Concluído', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Média' },
      low: { color: 'bg-green-100 text-green-800', label: 'Baixa' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_to_user': return <User className="h-4 w-4" />;
      case 'user_to_team': return <Users className="h-4 w-4" />;
      case 'team_to_team': return <Users className="h-4 w-4" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const filteredHandoffs = handoffs.filter(handoff => {
    switch (activeTab) {
      case 'pending': return handoff.status === 'pending';
      case 'accepted': return handoff.status === 'accepted';
      case 'rejected': return handoff.status === 'rejected';
      case 'completed': return handoff.status === 'completed';
      default: return true;
    }
  });

  const handleReject = (handoffId: number) => {
    if (rejectReason.trim()) {
      handleRejectHandoff(handoffId, rejectReason);
      setRejectReason('');
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos ({handoffs.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({handoffs.filter(h => h.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Aceitos ({handoffs.filter(h => h.status === 'accepted').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitados ({handoffs.filter(h => h.status === 'rejected').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({handoffs.filter(h => h.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredHandoffs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum handoff encontrado para esta categoria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHandoffs.map((handoff) => (
                <Card key={handoff.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(handoff.type)}
                            <span className="font-medium">
                              Handoff #{handoff.id}
                            </span>
                          </div>
                          {getStatusBadge(handoff.status || 'pending')}
                          {getPriorityBadge(handoff.priority || 'medium')}
                        </div>

                        {handoff.conversation && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>
                              {handoff.conversation.contactName || handoff.conversation.phone}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="font-medium text-gray-700">De:</div>
                            {handoff.fromUser && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {handoff.fromUser.displayName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{handoff.fromUser.displayName || 'Usuário'}</span>
                              </div>
                            )}
                            {handoff.fromTeam && (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: handoff.fromTeam.color || '#6B7280' }}
                                />
                                <span>{handoff.fromTeam.name || 'Equipe'}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="font-medium text-gray-700">Para:</div>
                            {handoff.toUser && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {handoff.toUser.displayName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{handoff.toUser.displayName || 'Usuário'}</span>
                              </div>
                            )}
                            {handoff.toTeam && (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: handoff.toTeam.color || '#6B7280' }}
                                />
                                <span>{handoff.toTeam.name || 'Equipe'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {handoff.reason && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Motivo: </span>
                            <span className="text-gray-600">{handoff.reason}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Criado {handoff.createdAt ? formatDistanceToNow(
                                new Date(handoff.createdAt), 
                                { addSuffix: true, locale: ptBR }
                              ) : 'há pouco tempo'}
                            </span>
                          </div>
                          {handoff.updatedAt && handoff.updatedAt !== handoff.createdAt && (
                            <div>
                              Atualizado {formatDistanceToNow(
                                new Date(handoff.updatedAt), 
                                { addSuffix: true, locale: ptBR }
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {handoff.status === 'pending' && (
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptHandoff(handoff.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aceitar
                          </Button>
                          
                          {rejectingId === handoff.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Motivo da rejeição..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-2 py-1 text-xs border rounded"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(handoff.id)}
                                  disabled={!rejectReason.trim()}
                                  className="text-xs px-2 py-1"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason('');
                                  }}
                                  className="text-xs px-2 py-1"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingId(handoff.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}