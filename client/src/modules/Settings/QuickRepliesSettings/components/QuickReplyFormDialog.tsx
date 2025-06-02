import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/ui/form';
import { Input } from '@/shared/ui/ui/input';
import { Button } from '@/shared/ui/ui/button';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Switch } from '@/shared/ui/ui/switch';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { Upload, X, Play, Pause, Volume2 } from 'lucide-react';
import { apiRequest } from '@/shared/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { QuickReply, InsertQuickReply } from '@shared/schema';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['text', 'audio', 'image', 'video']),
  content: z.string().optional(),
  shortcut: z.string().optional(),
  category: z.string().default('general'),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface QuickReplyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickReply?: QuickReply | null;
  onSuccess: () => void;
}

export function QuickReplyFormDialog({
  open,
  onOpenChange,
  quickReply,
  onSuccess,
}: QuickReplyFormDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'text',
      content: '',
      shortcut: '',
      category: 'general',
      isActive: true,
    },
  });

  const watchedType = form.watch('type');

  // Update form when editing existing quick reply
  useEffect(() => {
    if (quickReply) {
      form.reset({
        title: quickReply.title,
        description: quickReply.description || '',
        type: quickReply.type as 'text' | 'audio' | 'image' | 'video',
        content: quickReply.content || '',
        shortcut: quickReply.shortcut || '',
        category: quickReply.category || 'general',
        isActive: quickReply.isActive,
      });
      if (quickReply.fileUrl) {
        setPreviewUrl(quickReply.fileUrl);
      }
    } else {
      form.reset();
      setUploadedFile(null);
      setPreviewUrl('');
    }
  }, [quickReply, form, open]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add file if present
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const url = quickReply 
        ? `/api/quick-replies/${quickReply.id}`
        : '/api/quick-replies';
      
      const method = quickReply ? 'PUT' : 'POST';

      return apiRequest(url, {
        method,
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: quickReply ? "Resposta atualizada" : "Resposta criada",
        description: quickReply 
          ? "A resposta rápida foi atualizada com sucesso."
          : "A resposta rápida foi criada com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a resposta rápida.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const type = form.getValues('type');
    const isValidType = (
      (type === 'audio' && file.type.startsWith('audio/')) ||
      (type === 'image' && file.type.startsWith('image/')) ||
      (type === 'video' && file.type.startsWith('video/'))
    );

    if (!isValidType) {
      toast({
        title: "Tipo de arquivo inválido",
        description: `Selecione um arquivo de ${type} válido.`,
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-fill title if empty
    if (!form.getValues('title')) {
      form.setValue('title', file.name.split('.')[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl('');
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (!previewUrl) return;

    if (!audioElement) {
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const onSubmit = (data: FormData) => {
    // Validate required fields based on type
    if (data.type !== 'text' && !uploadedFile && !quickReply?.fileUrl) {
      toast({
        title: "Arquivo obrigatório",
        description: `É necessário enviar um arquivo de ${data.type}.`,
        variant: "destructive",
      });
      return;
    }

    if (data.type === 'text' && !data.content?.trim()) {
      form.setError('content', { message: 'Conteúdo é obrigatório para mensagens de texto.' });
      return;
    }

    mutation.mutate(data);
  };

  const renderFileUpload = () => {
    if (watchedType === 'text') return null;

    return (
      <FormItem>
        <FormLabel>Arquivo</FormLabel>
        <FormControl>
          <div className="space-y-4">
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Clique para selecionar um arquivo de {watchedType}
                </p>
                <input
                  type="file"
                  accept={
                    watchedType === 'audio' ? 'audio/*' :
                    watchedType === 'image' ? 'image/*' :
                    watchedType === 'video' ? 'video/*' : '*'
                  }
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-educhat-primary hover:bg-educhat-primary/90"
                >
                  Selecionar Arquivo
                </label>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {uploadedFile?.name || 'Arquivo atual'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {watchedType === 'image' && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-contain rounded"
                    />
                  )}
                  
                  {watchedType === 'video' && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full h-32 rounded"
                    />
                  )}
                  
                  {watchedType === 'audio' && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleAudioPlayback}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Volume2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Clique para ouvir</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </FormControl>
        <FormDescription>
          Tamanho máximo: 10MB. Formatos aceitos: {
            watchedType === 'audio' ? 'MP3, WAV, OGG' :
            watchedType === 'image' ? 'JPG, PNG, GIF' :
            watchedType === 'video' ? 'MP4, MOV, AVI' : ''
          }
        </FormDescription>
      </FormItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quickReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
          </DialogTitle>
          <DialogDescription>
            {quickReply 
              ? 'Edite as informações da resposta rápida.'
              : 'Crie uma nova resposta rápida para agilizar o atendimento.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Saudação inicial" {...field} />
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
                    <FormLabel>Tipo *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição opcional da resposta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === 'text' && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite o conteúdo da mensagem..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Você pode usar variáveis como {'{nome}'}, {'{empresa}'}, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {renderFileUpload()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shortcut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atalho</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: /ola" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comando rápido para inserir esta resposta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: saudacao, despedida" {...field} />
                    </FormControl>
                    <FormDescription>
                      Para organizar suas respostas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativa</FormLabel>
                    <FormDescription>
                      Resposta disponível para uso no atendimento
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? 'Salvando...' 
                  : quickReply ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}