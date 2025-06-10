import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Users, User, Zap, ArrowRight } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Team, SystemUser } from '@shared/schema';

interface ConversationAssignmentDropdownProps {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  currentMacrosetor?: string | null;
}

export function ConversationAssignmentDropdown({
  conversationId,
  currentTeamId,
  currentUserId,
  currentMacrosetor
}: ConversationAssignmentDropdownProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiHandoffLoading, setAiHandoffLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsResponse, usersResponse] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/system-users')
        ]);

        if (teamsResponse.ok && usersResponse.ok) {
          const teamsData = await teamsResponse.json();
          const usersData = await usersResponse.json();
          setTeams(teamsData);
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTeamAssignment = async (teamId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: teamId === 'none' ? null : parseInt(teamId), 
          method: 'manual' 
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: teamId === 'none' ? "Conversa movida para fila neutra" : "Conversa atribuída à equipe com sucesso"
        });
        // Refresh da página para atualizar os dados
        window.location.reload();
      } else {
        throw new Error('Erro na atribuição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir à equipe",
        variant: "destructive"
      });
    }
  };

  const handleUserAssignment = async (userId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId === 'none' ? null : parseInt(userId), 
          method: 'manual' 
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: userId === 'none' ? "Conversa não atribuída a usuário específico" : "Conversa atribuída ao usuário com sucesso"
        });
        // Refresh da página para atualizar os dados
        window.location.reload();
      } else {
        throw new Error('Erro na atribuição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir ao usuário",
        variant: "destructive"
      });
    }
  };

  // Função para handoff inteligente com IA
  const handleAiHandoff = async () => {
    setAiHandoffLoading(true);
    try {
      // Buscar as últimas mensagens para análise
      const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages?limit=10`);
      const messagesData = await messagesResponse.json();
      
      if (!messagesResponse.ok || !messagesData.messages?.length) {
        throw new Error('Não foi possível obter mensagens para análise');
      }

      // Criar classificação simplificada da IA baseada nas mensagens
      const lastMessages = messagesData.messages.slice(-5);
      const messageTexts = lastMessages
        .filter(msg => msg.content && msg.content.trim())
        .map(msg => msg.content)
        .join(' ');

      // Análise básica para determinar urgência e intenção
      const urgencyKeywords = ['urgente', 'emergência', 'problema', 'erro', 'não funciona', 'quebrado'];
      const supportKeywords = ['técnico', 'suporte', 'problema', 'erro', 'bug', 'não consegue'];
      const salesKeywords = ['comprar', 'preço', 'valor', 'curso', 'matrícula', 'inscrição'];
      const billingKeywords = ['cobrança', 'pagamento', 'fatura', 'boleto', 'cartão'];

      const textLower = messageTexts.toLowerCase();
      const hasUrgency = urgencyKeywords.some(keyword => textLower.includes(keyword));
      const hasSupport = supportKeywords.some(keyword => textLower.includes(keyword));
      const hasSales = salesKeywords.some(keyword => textLower.includes(keyword));
      const hasBilling = billingKeywords.some(keyword => textLower.includes(keyword));

      let intent = 'general_inquiry';
      if (hasSupport) intent = 'technical_support';
      else if (hasSales) intent = 'sales_inquiry';
      else if (hasBilling) intent = 'billing_issue';

      const aiClassification = {
        confidence: 75,
        urgency: hasUrgency ? 'high' : 'normal',
        frustrationLevel: hasUrgency ? 8 : 4,
        intent
      };

      // Avaliar necessidade de handoff
      const evaluationResponse = await fetch('/api/handoffs/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          aiClassification
        })
      });

      const evaluationData = await evaluationResponse.json();

      if (!evaluationResponse.ok) {
        throw new Error(evaluationData.error || 'Erro na avaliação de handoff');
      }

      if (!evaluationData.shouldHandoff) {
        toast({
          title: "Análise IA",
          description: "A IA determinou que esta conversa não precisa de transferência no momento"
        });
        return;
      }

      // Criar handoff automático
      const handoffResponse = await fetch('/api/handoffs/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          aiClassification
        })
      });

      const handoffData = await handoffResponse.json();

      if (!handoffResponse.ok) {
        throw new Error(handoffData.error || 'Erro ao criar handoff');
      }

      if (handoffData.handoffCreated) {
        toast({
          title: "Transferência IA Realizada",
          description: `${handoffData.suggestion.reason}`,
          duration: 5000
        });
        // Refresh da página para atualizar os dados
        window.location.reload();
      } else {
        toast({
          title: "Análise IA",
          description: handoffData.message || "Handoff não necessário"
        });
      }

    } catch (error) {
      console.error('Erro no handoff inteligente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro no handoff inteligente",
        variant: "destructive"
      });
    } finally {
      setAiHandoffLoading(false);
    }
  };

  const currentTeam = teams.find(team => team.id === currentTeamId);
  const currentUser = users.find(user => user.id === currentUserId);

  if (loading) {
    return <div className="text-xs text-gray-500">Carregando...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Seletor de Equipe */}
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500" />
        <Select
          value={currentTeamId ? currentTeamId.toString() : 'none'}
          onValueChange={handleTeamAssignment}
        >
          <SelectTrigger className="h-7 min-w-[120px] text-xs border-gray-300">
            <SelectValue>
              {currentTeam ? (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5"
                  style={{ backgroundColor: currentTeam.color + '20', color: currentTeam.color }}
                >
                  {currentTeam.name}
                </Badge>
              ) : (
                <span className="text-gray-500">Sem grupo</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Sem grupo (Fila neutra)</span>
            </SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id.toString()}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: team.color || '#6b7280' }}
                  />
                  {team.name}
                  {team.macrosetor && (
                    <span className="text-xs text-gray-500">
                      ({team.macrosetor})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seletor de Usuário */}
      <div className="flex items-center gap-1">
        <User className="h-4 w-4 text-gray-500" />
        <Select
          value={currentUserId ? currentUserId.toString() : 'none'}
          onValueChange={handleUserAssignment}
        >
          <SelectTrigger className="h-7 min-w-[120px] text-xs border-gray-300">
            <SelectValue>
              {currentUser ? (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {currentUser.displayName}
                </Badge>
              ) : (
                <span className="text-gray-500">Não atribuído</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Não atribuído</span>
            </SelectItem>
            {users.filter(user => user.isActive).map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {user.displayName}
                  <span className="text-xs text-gray-500">
                    ({user.username})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão de Handoff Inteligente */}
      <Button
        onClick={handleAiHandoff}
        disabled={aiHandoffLoading}
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
      >
        {aiHandoffLoading ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>Analisando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-600" />
            <span className="text-purple-700">Transferir IA</span>
          </div>
        )}
      </Button>

      {/* Indicador de macrosetor detectado automaticamente */}
      {currentMacrosetor && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
          {currentMacrosetor}
        </Badge>
      )}
    </div>
  );
}