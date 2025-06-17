import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { MessageSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface NotesSectionProps {
  contactName: string;
  notes: any[];
  onAddNote: (note: string) => void;
  onEditNote?: (noteId: number, content: string) => void;
  onDeleteNote?: (noteId: number) => void;
}

export function NotesSection({ contactName, notes, onAddNote, onEditNote, onDeleteNote }: NotesSectionProps) {
  const { toast } = useToast();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<any>(null);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await onAddNote(newNote.trim());
    setShowNoteDialog(false);
    setNewNote('');
  };

  const handleEditNote = async () => {
    if (!editingNote || !editingNote.content.trim()) return;
    
    if (onEditNote) {
      await onEditNote(editingNote.id, editingNote.content.trim());
      setEditingNote(null);
      toast({
        title: "Nota atualizada",
        description: "A nota foi atualizada com sucesso.",
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (onDeleteNote) {
      await onDeleteNote(noteId);
      setShowDeleteDialog(null);
      toast({
        title: "Nota excluída",
        description: "A nota foi excluída com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-900 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          Notas ({notes.length})
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
                  Adicionar nota para {contactName}
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

      {notes.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notes.map((note, index) => (
            <div key={note.id || index} className="bg-gray-50 p-3 rounded-lg group hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-700 mb-2 flex-1">{note.content}</p>
                {(onEditNote || onDeleteNote) && (
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingNote({ ...note })}
                        title="Editar nota"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    {onDeleteNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => setShowDeleteDialog(note)}
                        title="Excluir nota"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
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

      {/* Dialog de Edição */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Editar nota para {contactName}
              </label>
              <Textarea
                value={editingNote?.content || ''}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder="Digite sua nota aqui..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setEditingNote(null)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditNote}
              disabled={!editingNote?.content?.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 italic">
                "{showDeleteDialog?.content}"
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDeleteNote(showDeleteDialog.id)}
            >
              Excluir nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}