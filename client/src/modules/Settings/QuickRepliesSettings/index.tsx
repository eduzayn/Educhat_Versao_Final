import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { BackButton } from '@/shared/components/BackButton';
import { Plus, Search, MessageSquare, Mic, Image, Video, Edit, Trash2, Eye } from 'lucide-react';
import { QuickReplyFormDialog } from './components/QuickReplyFormDialog';
import { QuickReplyPreviewDialog } from './components/QuickReplyPreviewDialog';
import { apiRequest } from '@/shared/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { QuickReply } from '@shared/schema';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-4 w-4" />;
    case 'audio':
      return <Mic className="h-4 w-4" />;
    case 'image':
      return <Image className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'audio':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'image':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'video':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function QuickRepliesSettingsModule() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedQuickReply, setSelectedQuickReply] = useState<QuickReply | null>(null);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quick replies
  const { data: quickReplies = [], isLoading } = useQuery({
    queryKey: ['/api/quick-replies'],
    refetchOnWindowFocus: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/quick-replies/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-replies'] });
      toast({
        title: "Resposta rápida excluída",
        description: "A resposta rápida foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a resposta rápida.",
        variant: "destructive",
      });
    },
  });

  // Filter quick replies
  const filteredQuickReplies = quickReplies.filter((reply: QuickReply) => {
    const matchesSearch = reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (reply.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (reply.shortcut?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || reply.category === selectedCategory;
    const matchesType = selectedType === 'all' || reply.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get unique categories and types
  const categories = Array.from(new Set(quickReplies.map((reply: QuickReply) => reply.category).filter(Boolean)));
  const types = Array.from(new Set(quickReplies.map((reply: QuickReply) => reply.type)));

  const handleEdit = (quickReply: QuickReply) => {
    setEditingQuickReply(quickReply);
    setIsFormDialogOpen(true);
  };

  const handlePreview = (quickReply: QuickReply) => {
    setSelectedQuickReply(quickReply);
    setIsPreviewDialogOpen(true);
  };

  const handleDelete = (quickReply: QuickReply) => {
    if (confirm('Tem certeza que deseja excluir esta resposta rápida?')) {
      deleteMutation.mutate(quickReply.id);
    }
  };

  const handleFormClose = () => {
    setIsFormDialogOpen(false);
    setEditingQuickReply(null);
  };

  return (
    <div className="space-y-6">
      <BackButton to="/settings" label="Voltar às Configurações" />
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Respostas Rápidas</h2>
          <p className="text-muted-foreground">
            Gerencie templates de mensagens para agilizar o atendimento
          </p>
        </div>
        <Button onClick={() => setIsFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Resposta Rápida
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{quickReplies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Texto</p>
                <p className="text-2xl font-bold">
                  {quickReplies.filter((r: QuickReply) => r.type === 'text').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Áudio</p>
                <p className="text-2xl font-bold">
                  {quickReplies.filter((r: QuickReply) => r.type === 'audio').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Mídia</p>
                <p className="text-2xl font-bold">
                  {quickReplies.filter((r: QuickReply) => r.type === 'image' || r.type === 'video').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar respostas rápidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="all">Todos os tipos</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Replies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredQuickReplies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' 
                ? 'Nenhuma resposta encontrada' 
                : 'Nenhuma resposta rápida criada'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira resposta rápida para agilizar o atendimento.'}
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedType === 'all' && (
              <Button onClick={() => setIsFormDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Resposta
              </Button>
            )}
          </div>
        ) : (
          filteredQuickReplies.map((quickReply: QuickReply) => (
            <Card key={quickReply.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(quickReply.type)}
                    <CardTitle className="text-base">{quickReply.title}</CardTitle>
                  </div>
                  <Badge className={`text-xs ${getTypeBadgeColor(quickReply.type)}`}>
                    {quickReply.type}
                  </Badge>
                </div>
                {quickReply.description && (
                  <CardDescription className="text-sm">
                    {quickReply.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {quickReply.shortcut && (
                    <div className="text-xs text-muted-foreground">
                      Atalho: <code className="bg-muted px-1 py-0.5 rounded">{quickReply.shortcut}</code>
                    </div>
                  )}
                  
                  {quickReply.content && quickReply.type === 'text' && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {quickReply.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Categoria: {quickReply.category || 'Geral'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Usado {quickReply.usageCount || 0}x
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(quickReply)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quickReply)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(quickReply)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <QuickReplyFormDialog
        open={isFormDialogOpen}
        onOpenChange={handleFormClose}
        quickReply={editingQuickReply}
        onSuccess={() => {
          handleFormClose();
          queryClient.invalidateQueries({ queryKey: ['/api/quick-replies'] });
        }}
      />

      {/* Preview Dialog */}
      <QuickReplyPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        quickReply={selectedQuickReply}
      />
    </div>
  );
}