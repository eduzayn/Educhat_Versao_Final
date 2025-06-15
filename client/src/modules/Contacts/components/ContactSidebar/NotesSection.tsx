import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { MessageSquare, Plus } from 'lucide-react';

interface NotesSectionProps {
  contactName: string;
  notes: any[];
  onAddNote: (note: string) => void;
}

export function NotesSection({ contactName, notes, onAddNote }: NotesSectionProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await onAddNote(newNote.trim());
    setShowNoteDialog(false);
    setNewNote('');
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
  );
}