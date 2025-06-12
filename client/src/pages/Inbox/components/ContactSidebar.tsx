import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  MessageSquare, 
  Plus, 
  X,
  Users,
  DollarSign,
  TrendingUp,
  Edit,
  Briefcase
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getAllTeams, getStagesForTeam, getTeamInfo } from '@/lib/crmFunnels';

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const getStageColor = (stage: string, team?: string) => {
  if (team) {
    const stages = getStagesForTeam(team);
    const stageInfo = stages.find(s => s.id === stage);
    if (stageInfo) {
      // Convert bg-color to badge color
      const colorMap: Record<string, string> = {
        'bg-gray-500': 'bg-gray-100 text-gray-800',
        'bg-blue-500': 'bg-blue-100 text-blue-800',
        'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
        'bg-orange-500': 'bg-orange-100 text-orange-800',
        'bg-green-500': 'bg-green-100 text-green-800',
        'bg-red-500': 'bg-red-100 text-red-800',
        'bg-purple-500': 'bg-purple-100 text-purple-800',
        'bg-indigo-500': 'bg-indigo-100 text-indigo-800',
        'bg-emerald-500': 'bg-emerald-100 text-emerald-800',
        'bg-violet-500': 'bg-violet-100 text-violet-800'
      };
      return colorMap[stageInfo.color] || 'bg-gray-100 text-gray-800';
    }
  }
  return 'bg-gray-100 text-gray-800';
};

const getStageLabel = (stage: string, team?: string) => {
  if (team) {
    const stages = getStagesForTeam(team);
    const stageInfo = stages.find(s => s.id === stage);
    if (stageInfo) {
      return stageInfo.name.toUpperCase();
    }
  }
  return stage.toUpperCase();
};

interface ContactSidebarProps {
  activeConversation: any;
  contactNotes: any[];
  contactDeals: any[];
  contactInterests: any[];
  onAddNote: (note: string) => void;
}

export function ContactSidebar({ 
  activeConversation, 
  contactNotes, 
  contactDeals, 
  contactInterests, 
  onAddNote 
}: ContactSidebarProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingDealData, setEditingDealData] = useState<any>({});
  const [dealFormData, setDealFormData] = useState({
    name: '',
    value: '',
    team: '',
    stage: '',
    category: '',
    course: ''
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Buscar categorias e cursos quando o componente monta
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/courses/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };

    const fetchAllCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
          setFilteredCourses(data);
        }
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      }
    };

    fetchCategories();
    fetchAllCourses();
  }, []);

  // Filtrar cursos por categoria selecionada
  useEffect(() => {
    if (dealFormData.category && dealFormData.category !== '') {
      const fetchCoursesByCategory = async () => {
        try {
          const response = await fetch(`/api/courses/by-category/${encodeURIComponent(dealFormData.category)}`);
          if (response.ok) {
            const data = await response.json();
            setFilteredCourses(data);
          }
        } catch (error) {
          console.error('Erro ao buscar cursos por categoria:', error);
          setFilteredCourses(courses);
        }
      };
      fetchCoursesByCategory();
    } else {
      setFilteredCourses(courses);
    }
  }, [dealFormData.category, courses]);

  // Mutation para criar deal
  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowDealDialog(false);
      setDealFormData({ name: '', value: '', team: 'comercial', stage: 'prospecting', category: '', course: '' });
    },
    onError: (error: any) => {
      console.error('Erro ao criar negócio:', error);
    }
  });

  // Mutation para atualizar deal
  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setEditingDeal(null);
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar negócio:', error);
    }
  });

  const handleCreateDeal = () => {
    if (!dealFormData.name.trim()) return;

    const data = {
      name: dealFormData.name,
      contactId: activeConversation.contact.id,
      value: dealFormData.value ? Math.round(parseFloat(dealFormData.value) * 100) : 0,
      teamType: dealFormData.team,
      stage: dealFormData.stage,
      category: dealFormData.category || null,
      course: dealFormData.course || null,
      probability: 50,
      owner: 'Sistema'
    };

    createDealMutation.mutate(data);
  };

  const handleUpdateDeal = (deal: any, updates: any) => {
    const data: any = {};
    
    if (updates.value !== undefined) {
      data.value = Math.round(parseFloat(updates.value) * 100);
    }
    
    if (updates.stage !== undefined) {
      data.stage = updates.stage;
    }

    updateDealMutation.mutate({ id: deal.id, data });
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await onAddNote(newNote.trim());
    setShowNoteDialog(false);
    setNewNote('');
  };

  if (!activeConversation) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* 👤 Informações do Contato */}
        <div className="text-center">
          <Avatar className="w-16 h-16 mx-auto mb-3">
            <AvatarImage src={activeConversation.contact.profileImageUrl || ''} />
            <AvatarFallback className="text-lg font-semibold">
              {activeConversation.contact.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {activeConversation.contact.name}
          </h3>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge 
              variant={activeConversation.contact.isOnline ? "default" : "secondary"}
              className="text-xs"
            >
              {activeConversation.contact.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* 📞 Informações de Contato */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Contato</h4>
          
          {activeConversation.contact.phone && (
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.phone}</span>
            </div>
          )}
          
          {activeConversation.contact.email && (
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.email}</span>
            </div>
          )}
          
          {activeConversation.contact.address && (
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.address}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              Criado em {new Date(activeConversation.contact.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>



        {/* 💼 Negócios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900 flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Negócios
            </h4>
            
            <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingDeal(null);
                    setDealFormData({ name: '', value: '', team: 'comercial', stage: 'prospecting', category: '', course: '' });
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar negociação</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deal-name">Nome da negociação *</Label>
                    <Input
                      id="deal-name"
                      placeholder="Digite o nome da negociação"
                      value={dealFormData.name}
                      onChange={(e) => setDealFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deal-value">Valor</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        id="deal-value"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="pl-8"
                        value={dealFormData.value}
                        onChange={(e) => setDealFormData(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-blue-600 mr-2">🎓</span>
                      <span className="text-sm text-blue-600">Curso</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deal-team">Funil de vendas *</Label>
                    <Select 
                      value={dealFormData.team} 
                      onValueChange={(value) => {
                        setDealFormData(prev => ({ 
                          ...prev, 
                          team: value,
                          stage: '' // Reset stage when funnel changes
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funil" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllTeams().map(({ id, info }) => (
                          <SelectItem key={id} value={id}>
                            {info.name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dealFormData.team && (
                      <div className="mt-2 text-sm text-gray-600">
                        {getTeamInfo(dealFormData.team)?.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="deal-stage">Etapa do funil *</Label>
                    <Select 
                      value={dealFormData.stage} 
                      onValueChange={(value) => setDealFormData(prev => ({ ...prev, stage: value }))}
                      disabled={!dealFormData.team}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={dealFormData.team ? "Selecione a etapa" : "Primeiro selecione o funil"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dealFormData.team && getStagesForTeam(dealFormData.team).map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Categoria do Curso */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Categoria do Curso
                    </label>
                    <Select 
                      value={dealFormData.category} 
                      onValueChange={(value) => {
                        setDealFormData({...dealFormData, category: value, course: ''});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Curso de Interesse */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Curso de Interesse
                    </label>
                    <Select 
                      value={dealFormData.course} 
                      onValueChange={(value) => setDealFormData({...dealFormData, course: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum curso específico</SelectItem>
                        {filteredCourses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Contato</h5>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-sm">
                          {activeConversation.contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{activeConversation.contact.name}</p>
                        <p className="text-xs text-gray-500">{activeConversation.contact.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDealDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateDeal}
                      disabled={!dealFormData.name.trim() || createDealMutation.isPending}
                    >
                      {createDealMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {contactDeals && contactDeals.length > 0 ? (
            <div className="space-y-2">
              {contactDeals.map((deal: any) => (
                <Card key={deal.id} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm text-gray-900 truncate flex-1">
                        {deal.name}
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => {
                          setEditingDeal(deal);
                          setEditingDealData({});
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(deal.value || 0)}
                      </span>
                      <Badge className={`text-xs ${getStageColor(deal.stage, deal.team)}`}>
                        {getStageLabel(deal.stage, deal.team)}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {deal.team && getTeamInfo(deal.team) 
                        ? `${getTeamInfo(deal.team)?.name}` 
                        : deal.team?.toUpperCase()
                      } • Criado em {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Nenhum negócio encontrado</p>
            </div>
          )}
        </div>

        {/* Modal de Edição de Deal */}
        {editingDeal && (
          <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Editar Negócio</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-8"
                      defaultValue={(editingDeal.value / 100).toFixed(2)}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleUpdateDeal(editingDeal, { value: newValue });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Funil de vendas</Label>
                  <Select 
                    value={editingDealData.team || editingDeal.team} 
                    onValueChange={(value) => {
                      setEditingDealData((prev: any) => ({ 
                        ...prev, 
                        team: value,
                        stage: getStagesForTeam(value)[0]?.id || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllTeams().map(({ id, info }) => (
                        <SelectItem key={id} value={id}>
                          {info.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Etapa do Negócio</Label>
                  <Select 
                    value={editingDealData.stage || editingDeal.stage} 
                    onValueChange={(value) => {
                      setEditingDealData((prev: any) => ({ ...prev, stage: value }));
                    }}
                    disabled={!(editingDealData.team || editingDeal.team)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingDealData.team || editingDeal.team) && 
                        getStagesForTeam(editingDealData.team || editingDeal.team).map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name.toUpperCase()}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingDeal(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      const updates = { ...editingDealData };
                      if (Object.keys(updates).length > 0) {
                        handleUpdateDeal(editingDeal, updates);
                      }
                    }}
                    disabled={updateDealMutation.isPending}
                  >
                    {updateDealMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 🏷️ Outras Tags */}
        {activeConversation.contact.tags && Array.isArray(activeConversation.contact.tags) && (
          (() => {
            const otherTags = activeConversation.contact.tags.filter((tag: string) => 
              !tag.startsWith('Formado:') && 
              !tag.startsWith('Graduado:') && 
              !tag.startsWith('Pós-graduado:') && 
              !tag.startsWith('Interesse:')
            );
            
            return otherTags.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Outras Classificações
                </h4>
                <div className="flex flex-wrap gap-1">
                  {otherTags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null;
          })()
        )}

        {/* 📝 Notas do Contato */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notas ({contactNotes.length})
            </h4>
            
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Nota</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Adicionar nota para {activeConversation.contact.name}
                    </label>
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Digite sua nota aqui..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 Esta nota será visível apenas para a equipe interna e ficará anexada ao perfil do contato.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNoteDialog(false);
                      setNewNote('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Salvar nota
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {contactNotes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contactNotes.map((note, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.author || 'Sistema'}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nenhuma nota adicionada</p>
          )}
        </div>

        {/* 📦 Resumo Estatístico */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-900">Resumo</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-purple-50 p-2 rounded text-center">
              <div className="font-semibold text-purple-700">
                {activeConversation.messages?.length || 0}
              </div>
              <div className="text-purple-600">Mensagens</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="font-semibold text-green-700">
                {contactDeals.length}
              </div>
              <div className="text-green-600">Negócios</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="font-semibold text-blue-700">
                {contactNotes.length}
              </div>
              <div className="text-blue-600">Notas</div>
            </div>
            <div className="bg-orange-50 p-2 rounded text-center">
              <div className="font-semibold text-orange-700">
                {activeConversation.contact.isOnline ? 'On' : 'Off'}
              </div>
              <div className="text-orange-600">Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}