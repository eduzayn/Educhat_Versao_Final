import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TeamTransferCard } from './TeamTransferCard';
import { Plus, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  teamType: string;
  color?: string;
  memberCount?: number;
}

interface ConversationItem {
  id: number;
  contactName: string;
  lastMessage: string;
  unreadCount: number;
  status: string;
  channel: string;
  assignedTeamId: number;
  assignedUserId?: number;
  assignedUserName?: string;
  lastMessageAt: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface TeamColumnProps {
  team?: Team;
  conversations: ConversationItem[];
  isUnassigned?: boolean;
  onCreateConversation?: () => void;
}

export function TeamColumn({ team, conversations, isUnassigned = false, onCreateConversation }: TeamColumnProps) {
  const getTeamColor = (teamType?: string) => {
    const colors: { [key: string]: string } = {
      'vendas': 'bg-green-500',
      'suporte': 'bg-blue-500', 
      'cobranca': 'bg-red-500',
      'tutoria': 'bg-purple-500',
      'comercial': 'bg-yellow-500',
      'default': 'bg-gray-500'
    };
    return colors[teamType || 'default'] || colors.default;
  };

  const droppableId = isUnassigned ? 'unassigned' : String(team?.id || 0);
  const title = isUnassigned ? 'Não Atribuídas' : team?.name || 'Equipe';
  const colorClass = isUnassigned ? 'bg-gray-400' : getTeamColor(team?.teamType);

  return (
    <Card className="min-h-[500px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${colorClass}`} />
          <span className="flex-1">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {conversations.length}
          </Badge>
        </CardTitle>
        {team && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{team.memberCount || 0} membros</span>
            <Badge variant="outline" className="text-xs">
              {team.teamType}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <Droppable droppableId={droppableId} type="CONVERSATION">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 ${
                snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg p-2 border-2 border-dashed border-primary' : ''
              }`}
            >
              {conversations.map((conversation, index) => (
                <Draggable
                  key={conversation.id}
                  draggableId={String(conversation.id)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <TeamTransferCard
                      conversation={conversation}
                      provided={provided}
                      snapshot={snapshot}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {conversations.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  {snapshot.isDraggingOver ? (
                    <div className="text-center">
                      <div className="animate-pulse">
                        📥 Solte aqui para transferir
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl mb-2">📭</div>
                      <div>Nenhuma conversa</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>

        {/* Botão para adicionar conversa (opcional) */}
        {onCreateConversation && (
          <Button 
            variant="ghost" 
            className="w-full mt-3 flex-shrink-0" 
            size="sm"
            onClick={onCreateConversation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        )}
      </CardContent>
    </Card>
  );
}