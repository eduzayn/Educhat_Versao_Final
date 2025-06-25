import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { BackButton } from '@/shared/components/BackButton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { 
  Users, 
  ArrowRight, 
  Search, 
  Filter, 
  Clock, 
  MessageCircle,
  Settings,
  Plus,
  MessageSquare,
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';

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

interface TransferHistory {
  id: number;
  conversationId: number;
  fromTeamId: number;
  toTeamId: number;
  fromTeamName: string;
  toTeamName: string;
  reason: string;
  transferredBy: string;
  transferredAt: string;
  contactName: string;
}

export default function TeamTransferPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<number | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<{
    conversationId: number;
    fromTeamId: number;
    toTeamId: number;
  } | null>(null);

  // Estados para gerenciamento de palavras-chave
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<any>(null);
  const [keywordForm, setKeywordForm] = useState({
    keyword: '',
    teamId: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar equipes
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.map((team: any) => ({
          id: team.id,
          name: team.name,
          teamType: team.teamType || 'general',
          color: team.color || '#6366f1',
          memberCount: team.memberCount || 0
        })) : [];
      } catch (error) {
        console.error('Erro ao carregar equipes:', error);
        return [];
      }
    }
  });

  // Carregar conversas
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/conversations?limit=50');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.map((conv: any) => ({
          id: conv.id,
          contactName: conv.contact?.name || conv.contactName || 'Contato',
          lastMessage: conv.lastMessage || 'Sem mensagem',
          unreadCount: conv.unreadCount || 0,
          status: conv.status || 'open',
          channel: conv.channel || 'whatsapp',
          assignedTeamId: conv.assignedTeamId || null,
          assignedUserId: conv.assignedUserId || null,
          assignedUserName: conv.assignedUserName || null,
          lastMessageAt: conv.lastMessageAt || conv.updatedAt || new Date().toISOString(),
          contactPhone: conv.contact?.phone || conv.contactPhone,
          contactEmail: conv.contact?.email || conv.contactEmail
        })) : [];
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        return [];
      }
    }
  });

  // Carregar histórico de transferências
  const { data: transferHistory = [] } = useQuery({
    queryKey: ['/api/teams/transfer-history'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teams/transfer-history');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        return [];
      }
    }
  });

  // Carregar palavras-chave configuradas
  const { data: keywordRoutes = [], refetch: refetchKeywords } = useQuery({
    queryKey: ['/api/keyword-routing'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/keyword-routing');
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao carregar palavras-chave:', error);
        return [];
      }
    }
  });

  // Mutation para transferir conversa
  const transferMutation = useMutation({
    mutationFn: async (data: { conversationId: number; fromTeamId: number; toTeamId: number; reason: string }) => {
      return apiRequest('POST', '/api/teams/transfer-conversation', data);
    },
    onSuccess: () => {
      toast({
        title: "Conversa transferida",
        description: "A conversa foi transferida com sucesso para a nova equipe.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams/transfer-history'] });
      setShowTransferDialog(false);
      setPendingTransfer(null);
      setTransferReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro na transferência",
        description: error.message || "Não foi possível transferir a conversa.",
        variant: "destructive",
      });
    }
  });

  // Mutations para palavras-chave
  const keywordMutation = useMutation({
    mutationFn: async (data: { keyword: string; teamId: number; isActive: boolean }) => {
      const url = editingKeyword ? `/api/keyword-routing/${editingKeyword.id}` : '/api/keyword-routing';
      const method = editingKeyword ? 'PUT' : 'POST';
      
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({
        title: editingKeyword ? "Palavra-chave atualizada" : "Palavra-chave criada",
        description: "Configuração salva com sucesso.",
      });
      refetchKeywords();
      setShowKeywordDialog(false);
      setEditingKeyword(null);
      setKeywordForm({ keyword: '', teamId: '', isActive: true });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    }
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/keyword-routing/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Palavra-chave removida",
        description: "Configuração deletada com sucesso.",
      });
      refetchKeywords();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Não foi possível deletar a configuração.",
        variant: "destructive",
      });
    }
  });

  const toggleKeywordMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/keyword-routing/${id}/toggle`, {});
    },
    onSuccess: () => {
      toast({
        title: "Status alterado",
        description: "Status da palavra-chave atualizado.",
      });
      refetchKeywords();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  });

  // Filtrar conversas por termo de busca e equipe selecionada
  const filteredConversations = conversations.filter((conv: ConversationItem) => {
    const matchesSearch = (conv.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (conv.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeamFilter === null || conv.assignedTeamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  // Agrupar conversas por equipe
  const conversationsByTeam = teams.reduce((acc: any, team: Team) => {
    acc[team.id] = filteredConversations.filter((conv: ConversationItem) => 
      conv.assignedTeamId === team.id
    );
    return acc;
  }, {});

  // Adicionar grupo para conversas não atribuídas
  conversationsByTeam['unassigned'] = filteredConversations.filter((conv: ConversationItem) => 
    !conv.assignedTeamId
  );

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) return;

    const conversationId = parseInt(draggableId);
    const fromTeamId = source.droppableId === 'unassigned' ? null : parseInt(source.droppableId);
    const toTeamId = destination.droppableId === 'unassigned' ? null : parseInt(destination.droppableId);

    if (!toTeamId) {
      toast({
        title: "Transferência inválida",
        description: "Não é possível mover conversa para 'não atribuídas'.",
        variant: "destructive",
      });
      return;
    }

    // Configurar transferência pendente
    setPendingTransfer({
      conversationId,
      fromTeamId: fromTeamId || 0,
      toTeamId
    });
    setShowTransferDialog(true);
  };

  const handleConfirmTransfer = () => {
    if (!pendingTransfer) return;

    transferMutation.mutate({
      ...pendingTransfer,
      reason: transferReason
    });
  };

  // Handlers para palavras-chave
  const handleCreateKeyword = () => {
    setEditingKeyword(null);
    setKeywordForm({ keyword: '', teamId: '', isActive: true });
    setShowKeywordDialog(true);
  };

  const handleEditKeyword = (keyword: any) => {
    setEditingKeyword(keyword);
    setKeywordForm({
      keyword: keyword.keyword,
      teamId: keyword.teamId.toString(),
      isActive: keyword.isActive
    });
    setShowKeywordDialog(true);
  };

  const handleSaveKeyword = () => {
    if (!keywordForm.keyword.trim() || !keywordForm.teamId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    keywordMutation.mutate({
      keyword: keywordForm.keyword.trim(),
      teamId: parseInt(keywordForm.teamId),
      isActive: keywordForm.isActive
    });
  };

  const handleDeleteKeyword = (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta palavra-chave?')) {
      deleteKeywordMutation.mutate(id);
    }
  };

  const handleToggleKeyword = (id: number) => {
    toggleKeywordMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h2 className="text-2xl font-bold">Gestão de Transferências</h2>
            <p className="text-muted-foreground">
              Gerencie transferências manuais e regras automáticas
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Transferência Manual</TabsTrigger>
          <TabsTrigger value="automatic">Regras Automáticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por contato ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedTeamFilter || ''}
            onChange={(e) => setSelectedTeamFilter(e.target.value ? parseInt(e.target.value) : null)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas as equipes</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Painel de Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Coluna para conversas não atribuídas */}
          <Droppable droppableId="unassigned">
            {(provided) => (
              <Card className="h-fit min-h-[400px]" ref={provided.innerRef} {...provided.droppableProps}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    Não atribuídas
                    <Badge variant="secondary" className="ml-auto">
                      {conversationsByTeam['unassigned']?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {(conversationsByTeam['unassigned'] || []).slice(0, CARDS_PER_COLUMN).map((conversation: ConversationItem, index: number) => (
                    <Draggable key={conversation.id} draggableId={conversation.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 border rounded-lg cursor-move transition-all ${
                            snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {conversation.contactName}
                              </h4>
                              {conversation.contactPhone && (
                                <p className="text-xs text-gray-500 truncate">
                                  {conversation.contactPhone}
                                </p>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className={getStatusColor(conversation.status)}>
                              {conversation.status}
                            </Badge>
                            <span className="text-gray-400">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {/* Scroll infinito para conversas adicionais */}
                  {(conversationsByTeam['unassigned'] || []).length > CARDS_PER_COLUMN && (
                    <div className="space-y-3">
                      {(conversationsByTeam['unassigned'] || []).slice(CARDS_PER_COLUMN).map((conversation: ConversationItem, index: number) => (
                        <Draggable key={conversation.id} draggableId={conversation.id.toString()} index={index + CARDS_PER_COLUMN}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 border rounded-lg cursor-move transition-all ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {conversation.contactName}
                                  </h4>
                                  {conversation.contactPhone && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {conversation.contactPhone}
                                    </p>
                                  )}
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <Badge variant="outline" className={getStatusColor(conversation.status)}>
                                  {conversation.status}
                                </Badge>
                                <span className="text-gray-400">
                                  {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}
                  
                  {provided.placeholder}
                  {conversationsByTeam['unassigned']?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma conversa não atribuída</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </Droppable>

          {/* Colunas para cada equipe */}
          {teams.map((team: Team) => (
            <Droppable key={team.id} droppableId={team.id.toString()}>
              {(provided) => (
                <Card className="h-fit min-h-[400px]" ref={provided.innerRef} {...provided.droppableProps}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                      <Badge variant="secondary" className="ml-auto">
                        {conversationsByTeam[team.id]?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                    {(conversationsByTeam[team.id] || []).slice(0, CARDS_PER_COLUMN).map((conversation: ConversationItem, index: number) => (
                      <Draggable key={conversation.id} draggableId={conversation.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 border rounded-lg cursor-move transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {conversation.contactName}
                                </h4>
                                {conversation.contactPhone && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {conversation.contactPhone}
                                  </p>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className={getStatusColor(conversation.status)}>
                                {conversation.status}
                              </Badge>
                              <span className="text-gray-400">
                                {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {/* Scroll infinito para conversas adicionais */}
                    {(conversationsByTeam[team.id] || []).length > CARDS_PER_COLUMN && (
                      <div className="space-y-3">
                        {(conversationsByTeam[team.id] || []).slice(CARDS_PER_COLUMN).map((conversation: ConversationItem, index: number) => (
                          <Draggable key={conversation.id} draggableId={conversation.id.toString()} index={index + CARDS_PER_COLUMN}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg cursor-move transition-all ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">
                                      {conversation.contactName}
                                    </h4>
                                    {conversation.contactPhone && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {conversation.contactPhone}
                                      </p>
                                    )}
                                  </div>
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <Badge variant="outline" className={getStatusColor(conversation.status)}>
                                    {conversation.status}
                                  </Badge>
                                  <span className="text-gray-400">
                                    {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    )}

                    {provided.placeholder}
                    {conversationsByTeam[team.id]?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma conversa</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Histórico de Transferências */}
      {transferHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Transferências Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transferHistory.slice(0, 10).map((transfer: TransferHistory) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{transfer.contactName}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <Badge variant="outline">{transfer.fromTeamName}</Badge>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <Badge variant="secondary">{transfer.toTeamName}</Badge>
                    </div>
                    <p className="text-xs text-gray-600">{transfer.reason}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Transferido por: {transfer.transferredBy}</span>
                      <span>{new Date(transfer.transferredAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de transferência */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Transferência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transferReason">Motivo da transferência</Label>
              <Textarea
                id="transferReason"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Digite o motivo da transferência..."
                className="mt-1"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmTransfer} 
                disabled={!transferReason.trim() || transferMutation.isPending}
              >
                {transferMutation.isPending ? 'Transferindo...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="automatic" className="space-y-6">
          {/* Header da aba de regras automáticas */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Regras de Roteamento Automático</h2>
              <p className="text-gray-600">Configure palavras-chave para direcionar conversas automaticamente</p>
            </div>
            <Button onClick={handleCreateKeyword} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Regra
            </Button>
          </div>

          {/* Lista de palavras-chave */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Palavras-chave Configuradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keywordRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma regra configurada</h3>
                  <p className="text-gray-600 mb-4">Crie regras para direcionar conversas automaticamente com base em palavras-chave</p>
                  <Button onClick={handleCreateKeyword}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira regra
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {keywordRoutes.map((routing: any) => (
                    <div key={routing.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {routing.keyword}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <Badge variant="secondary">
                            {routing.teamName}
                          </Badge>
                          <Badge variant={routing.isActive ? "default" : "secondary"}>
                            {routing.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Criada em {new Date(routing.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleKeyword(routing.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {routing.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditKeyword(routing)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKeyword(routing.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explicação sobre o funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="font-medium">Mensagem recebida</h4>
                  <p className="text-sm text-gray-600">Uma nova mensagem chega no sistema</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="font-medium">Análise de conteúdo</h4>
                  <p className="text-sm text-gray-600">O sistema verifica se a mensagem contém alguma palavra-chave configurada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="font-medium">Roteamento automático</h4>
                  <p className="text-sm text-gray-600">Se encontrar uma palavra-chave, a conversa é automaticamente direcionada para a equipe correspondente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar/editar palavra-chave */}
      <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKeyword ? 'Editar Regra' : 'Nova Regra de Roteamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyword">Palavra-chave</Label>
              <Input
                id="keyword"
                value={keywordForm.keyword}
                onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                placeholder="Digite a palavra-chave (ex: preço, problema, boleto)"
              />
              <p className="text-xs text-gray-500 mt-1">
                A busca é feita de forma parcial e não diferencia maiúsculas/minúsculas
              </p>
            </div>
            
            <div>
              <Label htmlFor="teamId">Equipe de destino</Label>
              <select
                id="teamId"
                value={keywordForm.teamId}
                onChange={(e) => setKeywordForm({ ...keywordForm, teamId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={keywordForm.isActive}
                onChange={(e) => setKeywordForm({ ...keywordForm, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Regra ativa</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowKeywordDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveKeyword} disabled={keywordMutation.isPending}>
                {keywordMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}