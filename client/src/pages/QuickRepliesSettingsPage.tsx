import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { BackButton } from '@/shared/components/BackButton';
import { Plus, Search, MessageSquare, Mic, Image, Video, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Textarea } from '@/shared/ui/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/shared/lib/hooks/use-toast';
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

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  type: z.enum(['text', 'audio', 'image', 'video']),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function QuickRepliesSettingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [previewQuickReply, setPreviewQuickReply] = useState<QuickReply | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch quick replies
  const { data: quickReplies = [], isLoading } = useQuery({
    queryKey: ['/api/quick-replies'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies');
      if (!response.ok) throw new Error('Failed to fetch quick replies');
      return response.json() as Promise<QuickReply[]>;
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData & { id?: number }) => {
      const url = data.id ? `/api/quick-replies/${data.id}` : '/api/quick-replies';
      const method = data.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save quick reply');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-replies'] });
      setIsFormOpen(false);
      setEditingQuickReply(null);
      toast({
        title: 'Sucesso',
        description: 'Resposta rápida salva com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar resposta rápida',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quick-replies/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete quick reply');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-replies'] });
      toast({
        title: 'Sucesso',
        description: 'Resposta rápida excluída com sucesso!',
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'text',
      category: '',
      isActive: true,
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      ...(editingQuickReply && { id: editingQuickReply.id }),
    });
  };

  const handleEdit = (quickReply: QuickReply) => {
    setEditingQuickReply(quickReply);
    form.reset({
      title: quickReply.title,
      content: quickReply.content || '',
      type: quickReply.type as 'text' | 'audio' | 'image' | 'video',
      category: quickReply.category || '',
      isActive: quickReply.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const handlePreview = (quickReply: QuickReply) => {
    setPreviewQuickReply(quickReply);
    setIsPreviewOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta resposta rápida?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter quick replies
  const filteredQuickReplies = quickReplies.filter((qr: QuickReply) => {
    const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (qr.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || qr.category === selectedCategory;
    const matchesType = selectedType === 'all' || qr.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get unique categories
  const categories = Array.from(new Set(quickReplies.map((qr: QuickReply) => qr.category).filter(Boolean)));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <BackButton />
          <h2 className="text-3xl font-bold tracking-tight mt-2">Respostas Rápidas</h2>
          <p className="text-muted-foreground">
            Gerencie suas respostas rápidas para agilizar o atendimento
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar respostas rápidas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category || ''}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="audio">Áudio</SelectItem>
            <SelectItem value="image">Imagem</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingQuickReply(null);
              form.reset({
                title: '',
                content: '',
                type: 'text',
                category: '',
                isActive: true,
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingQuickReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título da resposta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="audio">Áudio</SelectItem>
                          <SelectItem value="image">Imagem</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite o conteúdo da resposta"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Replies Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredQuickReplies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Nenhuma resposta rápida encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando sua primeira resposta rápida.
            </p>
          </div>
        ) : (
          filteredQuickReplies.map((quickReply: QuickReply) => (
            <Card key={quickReply.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(quickReply.type)}
                    <CardTitle className="text-base">{quickReply.title}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(quickReply)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(quickReply)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quickReply.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeBadgeColor(quickReply.type)}>
                    {quickReply.type === 'text' && 'Texto'}
                    {quickReply.type === 'audio' && 'Áudio'}
                    {quickReply.type === 'image' && 'Imagem'}
                    {quickReply.type === 'video' && 'Vídeo'}
                  </Badge>
                  {quickReply.category && (
                    <Badge variant="outline">{quickReply.category}</Badge>
                  )}
                  {(quickReply.usageCount || 0) > 0 && (
                    <Badge variant="secondary">
                      {quickReply.usageCount || 0} usos
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {quickReply.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Visualizar Resposta Rápida</DialogTitle>
          </DialogHeader>
          {previewQuickReply && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{previewQuickReply.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getTypeBadgeColor(previewQuickReply.type)}>
                    {previewQuickReply.type === 'text' && 'Texto'}
                    {previewQuickReply.type === 'audio' && 'Áudio'}
                    {previewQuickReply.type === 'image' && 'Imagem'}
                    {previewQuickReply.type === 'video' && 'Vídeo'}
                  </Badge>
                  {previewQuickReply.category && (
                    <Badge variant="outline">{previewQuickReply.category}</Badge>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{previewQuickReply.content}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Usado {previewQuickReply.usageCount} vez(es)
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}