import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { SafeAvatar } from '@/components/SafeAvatar';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  MessageSquare, 
  Plus, 
  X,
  GraduationCap,
  BookOpen,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { InlineEditField } from './InlineEditField';

import { InlineContactNameEdit } from './InlineContactNameEdit';
import { QuickDealEdit } from './QuickDealEdit';
import { ContactTagsManager } from '@/components/ContactTagsManager';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getAllCategories, getStagesForCategory, getCategoryInfo } from '@/shared/lib/crmFunnels';
import { useDynamicFunnels } from '@/hooks/useDynamicFunnels';

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const getStageColor = (stage: string, category?: string) => {
  if (category) {
    const stages = getStagesForCategory(category);
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

const getStageLabel = (stage: string, category?: string) => {
  if (category) {
    const stages = getStagesForCategory(category);
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
  onDealUpdated?: () => void; // Callback para recarregar deals
}

export function ContactSidebar({ 
  activeConversation, 
  contactNotes, 
  contactDeals, 
  contactInterests, 
  onAddNote,
  onDealUpdated
}: ContactSidebarProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showDealDialog, setShowDealDialog] = useState(false);

  // Buscar funis dinâmicos (estáticos + baseados em equipes do banco)
  const { data: dynamicFunnels = [], isLoading: funnelsLoading } = useDynamicFunnels();

  // Buscar canais para determinar canal de origem
  const { data: channels = [] } = useQuery({
    queryKey: ['/api/channels'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Type guard para garantir que channels é um array
  const safeChannels = Array.isArray(channels) ? channels : [];

  // Função para determinar o canal de origem (aproveitando lógica existente)
  const getOriginChannelName = (conversation: any) => {
    // PRIORIDADE 1: Busca por channelId específico (canal real de origem)
    if (conversation.channelId) {
      const channel = safeChannels.find((c: any) => c.id === conversation.channelId);
      if (channel) {
        return channel.type === 'whatsapp' 
          ? channel.name 
          : `${channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} - ${channel.name}`;
      }
    }
    
    // PRIORIDADE 2: Usar o nome do canal do webhook (comercial, suporte, etc.)
    const channelType = conversation.channel || 'unknown';
    
    // Mapeamento direto dos canais do webhook Z-API
    const directChannelMapping: Record<string, string> = {
      'comercial': 'Canal Comercial',
      'suporte': 'Canal Suporte'
      // Removido mapeamento genérico 'whatsapp': 'WhatsApp Geral' para evitar exibição incorreta
    };
    
    // Se é um canal mapeado diretamente, retorna o nome correto
    if (directChannelMapping[channelType]) {
      return directChannelMapping[channelType];
    }
    
    // PRIORIDADE 3: Buscar canal WhatsApp por configuração (apenas quando não há mapeamento direto)
    if ((channelType === 'whatsapp' && !directChannelMapping[channelType]) || (!directChannelMapping[channelType] && channelType.includes('whatsapp'))) {
      const whatsappChannels = safeChannels.filter((c: any) => c.type === 'whatsapp' && c.isActive);
      
      // Se há apenas um canal ativo, usa esse
      if (whatsappChannels.length === 1) {
        return whatsappChannels[0]?.name || 'WhatsApp';
      }
      
      // Se há múltiplos canais, tenta mapear por nome do canal específico
      const specificChannel = whatsappChannels.find((c: any) => {
        const channelName = c.name?.toLowerCase() || '';
        return (channelName.includes('comercial') && channelType === 'comercial') ||
               (channelName.includes('suporte') && channelType === 'suporte');
      });
      
      if (specificChannel) {
        return specificChannel.name;
      }
      
      // Fallback: usa primeiro canal ativo disponível
      return whatsappChannels[0]?.name || 'Canal WhatsApp';
    }
    
    // PRIORIDADE 4: Mapeamento de tipos de canal conhecidos
    const channelTypeNames: Record<string, string> = {
      'whatsapp': 'WhatsApp',
      'telegram': 'Telegram',
      'sms': 'SMS',
      'email': 'Email',
      'facebook': 'Facebook',
      'instagram': 'Instagram'
    };
    
    return channelTypeNames[channelType] || 'Canal Desconhecido';
  };

  const [dealFormData, setDealFormData] = useState({
    name: '',
    value: '',
    category: '', // Agora representa o funil CRM
    stage: '',
    course: ''
  });
  
  const queryClient = useQueryClient();

  // Sistema unificado usando funis CRM dinâmicos
  // Não precisa mais buscar categorias/cursos - usa getAllCategories() e getStagesForCategory()

  // Mutation para criar deal
  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowDealDialog(false);
      setDealFormData({ name: '', value: '', category: '', stage: '', course: '' });
    },
    onError: (error: any) => {
      console.error('Erro ao criar negócio:', error);
    }
  });





  const handleCreateDeal = () => {
    if (!dealFormData.name.trim()) return;

    const data = {
      name: dealFormData.name,
      contactId: activeConversation.contact?.id,
      value: dealFormData.value ? Math.round(parseFloat(dealFormData.value) * 100) : 0,
      category: dealFormData.category || null,
      stage: dealFormData.stage,
      course: dealFormData.course || null,
      probability: 50,
      owner: 'Sistema'
    };

    createDealMutation.mutate(data);
  };





  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await onAddNote(newNote.trim());
    setShowNoteDialog(false);
    setNewNote('');
  };

  if (!activeConversation || !activeConversation.contact) return null;

  return (
    <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* 👤 Informações do Contato */}
        <div className="text-center">
          <SafeAvatar
            src={activeConversation.contact?.profileImageUrl}
            alt={activeConversation.contact?.name || 'Contato'}
            fallbackText={activeConversation.contact?.name || 'C'}
            className="w-16 h-16 mx-auto mb-3"
            fallbackClassName="text-lg font-semibold bg-blue-500"
          />
          
          <InlineContactNameEdit
            contactId={activeConversation.contact?.id}
            currentName={activeConversation.contact?.name || 'Contato'}
            className="mb-1"
          />
          
          <div className="flex items-center justify-center space-x-2">
            <Badge 
              variant={activeConversation.contact?.isOnline ? "default" : "secondary"}
              className="text-xs"
            >
              {activeConversation.contact?.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* 📞 Informações de Contato */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Contato</h4>
          
          {activeConversation.contact?.phone && (
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.phone}</span>
            </div>
          )}
          
          {activeConversation.contact?.email && (
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.email}</span>
            </div>
          )}
          
          {activeConversation.contact?.address && (
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{activeConversation.contact.address}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              Criado em {new Date(activeConversation.contact?.createdAt || Date.now()).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              Canal de Origem: {getOriginChannelName(activeConversation)}
            </span>
          </div>
        </div>

        {/* 🎓 Área de Formação */}
        <div className="space-y-3">
          <InlineEditField
            label="Área de Formação"
            value={activeConversation.contact?.educationalBackground || ''}
            contactId={activeConversation.contact?.id}
            field="educationalBackground"
            type="text"
            placeholder="Ex: Administração, Engenharia, etc."
          />
          
          {activeConversation.contact?.tags && Array.isArray(activeConversation.contact.tags) ? (
            (() => {
              const formationTags = activeConversation.contact.tags.filter((tag: string) => 
                tag.startsWith('Formado:') || tag.startsWith('Graduado:') || tag.startsWith('Pós-graduado:')
              );
              
              return formationTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Cursos Concluídos (Detectados)
                    </h5>
                    <div className="space-y-1">
                      {formationTags.map((tag: string, index: number) => (
                        <div key={`formation-${index}`} className="bg-white border border-blue-100 p-2 rounded-md">
                          <p className="text-sm font-medium text-blue-800">
                            {tag.replace(/^(Formado:|Graduado:|Pós-graduado:)\s*/, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()
          ) : null}
        </div>

        {/* 🎯 Área de Interesse */}
        <div className="space-y-3">
          <InlineEditField
            label="Área de Interesse"
            value={activeConversation.contact?.educationalInterest || ''}
            contactId={activeConversation.contact?.id}
            field="educationalInterest"
            type="text"
            placeholder="Ex: MBA, Pós-graduação em Marketing, etc."
          />
          
          {activeConversation.contact?.tags && Array.isArray(activeConversation.contact.tags) ? (
            (() => {
              const interestTags = activeConversation.contact.tags.filter((tag: string) => 
                tag.startsWith('Interesse:')
              );
              
              return interestTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Cursos de Interesse (Detectados)
                    </h5>
                    <div className="space-y-1">
                      {interestTags.map((tag: string, index: number) => (
                        <div key={`interest-${index}`} className="bg-white border border-blue-100 p-2 rounded-md">
                          <p className="text-sm font-medium text-blue-800">
                            {tag.replace('Interesse: ', '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()
          ) : null}
        </div>

        {/* 🏷️ Sistema de Tags */}
        {activeConversation.contact?.id && (
          <ContactTagsManager contactId={activeConversation.contact.id} />
        )}

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
                    setDealFormData({ name: '', value: '', category: '', stage: '', course: '' });
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
                    <Label htmlFor="deal-category">Funil de vendas *</Label>
                    <Select 
                      value={dealFormData.category} 
                      onValueChange={(value) => {
                        setDealFormData(prev => ({ 
                          ...prev, 
                          category: value,
                          stage: '' // Reset stage when funnel changes
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funil" />
                      </SelectTrigger>
                      <SelectContent>
                        {funnelsLoading ? (
                          <SelectItem value="loading" disabled>
                            Carregando funis...
                          </SelectItem>
                        ) : (
                          dynamicFunnels.map(({ id, info }) => (
                            <SelectItem key={id} value={id}>
                              {info.name.toUpperCase()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {dealFormData.category && (
                      <div className="mt-2 text-sm text-gray-600">
                        {getCategoryInfo(dealFormData.category)?.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="deal-stage">Etapa do funil *</Label>
                    <Select 
                      value={dealFormData.stage} 
                      onValueChange={(value) => setDealFormData(prev => ({ ...prev, stage: value }))}
                      disabled={!dealFormData.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={dealFormData.category ? "Selecione a etapa" : "Primeiro selecione o funil"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dealFormData.category && getStagesForCategory(dealFormData.category).map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observações */}
                  <div>
                    <Label htmlFor="deal-notes">Observações</Label>
                    <Textarea
                      id="deal-notes"
                      placeholder="Detalhes adicionais sobre o negócio..."
                      rows={2}
                      value={dealFormData.course}
                      onChange={(e) => setDealFormData(prev => ({ ...prev, course: e.target.value }))}
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Contato</h5>
                    <div className="flex items-center space-x-2">
                      <SafeAvatar
                        src={activeConversation.contact?.profileImageUrl}
                        alt={activeConversation.contact?.name || 'Contato'}
                        fallbackText={activeConversation.contact?.name || 'C'}
                        className="w-8 h-8"
                        fallbackClassName="text-sm bg-gray-500"
                      />
                      <div>
                        <p className="font-medium text-sm">{activeConversation.contact?.name || 'Contato'}</p>
                        <p className="text-xs text-gray-500">{activeConversation.contact?.phone || ''}</p>
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
                <QuickDealEdit
                  key={deal.id}
                  deal={deal}
                  contactId={activeConversation.contact?.id}
                  onDealUpdated={onDealUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Nenhum negócio cadastrado</p>
            </div>
          )}
        </div>



        {/* 🏷️ Outras Tags */}
        {activeConversation.contact?.tags && Array.isArray(activeConversation.contact.tags) && (
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
                  {otherTags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
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
                      Adicionar nota para {activeConversation.contact?.name || 'Contato'}
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
              {contactNotes.map((note) => (
                <div key={note.id || note.createdAt} className="bg-gray-50 p-3 rounded-lg">
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


      </div>
    </div>
  );
}