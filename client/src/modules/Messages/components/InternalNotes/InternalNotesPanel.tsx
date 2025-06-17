import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { Plus, StickyNote, Search, Filter, Edit, Trash2, Clock, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Message } from '@shared/schema';

interface InternalNote {
  id: number;
  content: string;
  authorName: string;
  sentAt: Date;
  noteType?: string | null;
  notePriority?: string | null;
  noteTags?: string[] | null;
  isPrivate?: boolean | null;
}

interface InternalNotesPanelProps {
  conversationId: number;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' }
];

const NOTE_TYPES = [
  { value: 'general', label: 'Geral' },
  { value: 'task', label: 'Tarefa' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'escalation', label: 'Escalação' },
  { value: 'follow-up', label: 'Follow-up' }
];

export function InternalNotesPanel({ conversationId, isOpen, onClose }: InternalNotesPanelProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [editingNote, setEditingNote] = useState<InternalNote | null>(null);
  
  // Formulário de criação/edição
  const [formData, setFormData] = useState({
    content: '',
    noteType: 'general',
    notePriority: 'normal',
    noteTags: [] as string[],
    isPrivate: false
  });
  
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();

  // Carregar notas ao abrir o painel
  useEffect(() => {
    if (isOpen && conversationId) {
      loadNotes();
    }
  }, [isOpen, conversationId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/internal-notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        throw new Error('Erro ao carregar notas');
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas internas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!formData.content.trim()) {
      toast({
        title: 'Erro',
        description: 'O conteúdo da nota é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/internal-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        resetForm();
        setShowCreateForm(false);
        toast({
          title: 'Sucesso',
          description: 'Nota interna criada com sucesso'
        });
      } else {
        throw new Error('Erro ao criar nota');
      }
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a nota interna',
        variant: 'destructive'
      });
    }
  };

  const updateNote = async () => {
    if (!editingNote || !formData.content.trim()) return;

    try {
      const response = await fetch(`/api/internal-notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id ? updatedNote : note
        ));
        resetForm();
        setEditingNote(null);
        toast({
          title: 'Sucesso',
          description: 'Nota interna atualizada com sucesso'
        });
      } else {
        throw new Error('Erro ao atualizar nota');
      }
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a nota interna',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      content: '',
      noteType: 'general',
      notePriority: 'normal',
      noteTags: [],
      isPrivate: false
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.noteTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        noteTags: [...prev.noteTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      noteTags: prev.noteTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const startEdit = (note: InternalNote) => {
    setFormData({
      content: note.content,
      noteType: note.noteType || 'general',
      notePriority: note.notePriority || 'normal',
      noteTags: note.noteTags || [],
      isPrivate: note.isPrivate || false
    });
    setEditingNote(note);
    setShowCreateForm(true);
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || note.notePriority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notas Internas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setEditingNote(null);
                  setShowCreateForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Nota
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="flex h-full">
            {/* Lista de Notas */}
            <div className="flex-1 border-r">
              <ScrollArea className="h-full p-4">
                {loading ? (
                  <div className="text-center py-8">Carregando notas...</div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery || filterPriority ? 'Nenhuma nota encontrada' : 'Nenhuma nota interna criada'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotes.map((note) => {
                      const priorityConfig = getPriorityConfig(note.notePriority || 'normal');
                      
                      return (
                        <Card key={note.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={priorityConfig.color}>
                                  {priorityConfig.label}
                                </Badge>
                                <Badge variant="outline">
                                  {NOTE_TYPES.find(t => t.value === note.noteType)?.label || 'Geral'}
                                </Badge>
                                {note.isPrivate && (
                                  <Badge variant="secondary">Privada</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(note)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                            
                            {note.noteTags && note.noteTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {note.noteTags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {note.authorName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(note.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Formulário de Criação/Edição */}
            {showCreateForm && (
              <div className="w-80 border-l bg-gray-50">
                <div className="p-4 h-full flex flex-col">
                  <h3 className="font-medium mb-4">
                    {editingNote ? 'Editar Nota' : 'Nova Nota Interna'}
                  </h3>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                      <Textarea
                        placeholder="Digite o conteúdo da nota..."
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="min-h-24"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Tipo</label>
                        <Select value={formData.noteType} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, noteType: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTE_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Prioridade</label>
                        <Select value={formData.notePriority} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, notePriority: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map(priority => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Adicionar tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addTag}>
                          +
                        </Button>
                      </div>
                      {formData.noteTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {formData.noteTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      />
                      <label htmlFor="isPrivate" className="text-sm">Nota privada</label>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={editingNote ? updateNote : createNote}
                      className="flex-1"
                    >
                      {editingNote ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingNote(null);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}