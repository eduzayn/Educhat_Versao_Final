import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Badge } from '@/shared/ui/ui/badge';
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
  Users
} from 'lucide-react';

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

        {/* 🎓 Área de Formação */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 flex items-center">
            <GraduationCap className="w-4 h-4 mr-2" />
            Área de Formação
          </h4>
          
          {activeConversation.contact.tags && Array.isArray(activeConversation.contact.tags) ? (
            (() => {
              const formationTags = activeConversation.contact.tags.filter((tag: string) => 
                tag.startsWith('Formado:') || tag.startsWith('Graduado:') || tag.startsWith('Pós-graduado:')
              );
              
              return formationTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Cursos Concluídos
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
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">
                    Nenhuma formação identificada
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">
                Nenhuma formação identificada
              </p>
            </div>
          )}
        </div>

        {/* 🎯 Área de Interesse */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Área de Interesse
          </h4>
          
          {activeConversation.contact.tags && Array.isArray(activeConversation.contact.tags) ? (
            (() => {
              const interestTags = activeConversation.contact.tags.filter((tag: string) => 
                tag.startsWith('Interesse:')
              );
              
              return interestTags.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Cursos de Interesse
                    </h5>
                    <div className="space-y-1">
                      {interestTags.map((tag: string, index: number) => (
                        <div key={`interest-${index}`} className="bg-white border border-green-100 p-2 rounded-md">
                          <p className="text-sm font-medium text-green-800">
                            {tag.replace('Interesse: ', '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">
                    Nenhum interesse identificado
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">
                Nenhum interesse identificado
              </p>
            </div>
          )}
        </div>

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