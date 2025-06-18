import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ArrowRight, CheckCircle, XCircle, User, Zap, AlertTriangle } from 'lucide-react';
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

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'automatic': return <Zap className="h-4 w-4" />;
    case 'manual': return <User className="h-4 w-4" />;
    case 'escalation': return <AlertTriangle className="h-4 w-4" />;
    default: return <ArrowRight className="h-4 w-4" />;
  }
}

export function HandoffsList({ handoffs, activeTab, setActiveTab, handleAcceptHandoff, handleRejectHandoff, onSelectHandoff }: HandoffsListProps) {
  const filteredHandoffs = handoffs.filter(handoff => {
    switch (activeTab) {
      case 'pending': return handoff.status === 'pending';
      case 'completed': return handoff.status === 'completed';
      case 'rejected': return handoff.status === 'rejected';
      default: return true;
    }
  });

  return (
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
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectHandoff?.(handoff)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(handoff.type)}
                      <span className="font-medium">
                        Conversa #{handoff.conversationId}
                      </span>
                      <Badge variant="outline" className={getStatusColor(handoff.status || '')}>
                        {handoff.status || ''}
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
  );
} 