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

interface HandoffWithDetails {
  id: number;
  type: string;
  status: string;
  priority: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
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
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Média' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      manual: User,
      automatic: MessageSquare,
      escalation: AlertTriangle,
      team_change: Users
    };

    const Icon = typeIcons[type as keyof typeof typeIcons] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const filteredHandoffs = handoffs.filter(handoff => {
    if (activeTab === 'all') return true;
    return handoff.status === activeTab;
  });

  const handleReject = (handoffId: number) => {
    if (rejectingId === handoffId && rejectReason.trim()) {
      handleRejectHandoff(handoffId, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
    } else {
      setRejectingId(handoffId);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredHandoffs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum handoff encontrado
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {activeTab === 'all' 
                    ? 'Não há handoffs registrados no sistema.'
                    : `Não há handoffs com status "${activeTab}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHandoffs.map((handoff) => (
                <Card key={handoff.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(handoff.type)}
                            <span className="font-medium text-gray-900">
                              Handoff #{handoff.id}
                            </span>
                          </div>
                          {getStatusBadge(handoff.status)}
                          {getPriorityBadge(handoff.priority)}
                        </div>

                        {/* Conversation Info */}
                        {handoff.conversation && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>{handoff.conversation.contactName}</span>
                            <span>•</span>
                            <span>{handoff.conversation.phone}</span>
                          </div>
                        )}

                        {/* Transfer Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">De:</span>
                            {handoff.fromUser ? (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {handoff.fromUser.displayName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{handoff.fromUser.displayName}</span>
                              </div>
                            ) : handoff.fromTeam ? (
                              <Badge 
                                className="text-xs"
                                style={{ backgroundColor: handoff.fromTeam.color + '20', color: handoff.fromTeam.color }}
                              >
                                {handoff.fromTeam.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Sistema</span>
                            )}
                          </div>

                          <ArrowRight className="h-4 w-4 text-gray-400" />

                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Para:</span>
                            {handoff.toUser ? (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {handoff.toUser.displayName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{handoff.toUser.displayName}</span>
                              </div>
                            ) : handoff.toTeam ? (
                              <Badge 
                                className="text-xs"
                                style={{ backgroundColor: handoff.toTeam.color + '20', color: handoff.toTeam.color }}
                              >
                                {handoff.toTeam.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Não definido</span>
                            )}
                          </div>
                        </div>

                        {/* Reason */}
                        {handoff.reason && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Motivo:</span> {handoff.reason}
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Criado {formatDistanceToNow(new Date(handoff.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                          {handoff.updatedAt !== handoff.createdAt && (
                            <span>
                              Atualizado {formatDistanceToNow(new Date(handoff.updatedAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {handoff.status === 'pending' && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptHandoff(handoff.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(handoff.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Reject Reason Input */}
                    {rejectingId === handoff.id && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Motivo da rejeição..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && rejectReason.trim()) {
                                handleReject(handoff.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleReject(handoff.id)}
                            disabled={!rejectReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
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
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
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