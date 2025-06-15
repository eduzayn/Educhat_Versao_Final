import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/ui/alert-dialog';
import { ContactAvatar } from '@/shared/ui/ContactAvatar';
import { Textarea } from '@/shared/ui/textarea';
import { Search, Plus, Eye, Edit, Trash2, Phone, ChevronRight, MessageCircle, Users, Mail, Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useContacts, useUpdateContact, useDeleteContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useActiveWhatsAppChannels } from '@/shared/lib/hooks/useChannels';

import { ContactFilters } from '@/modules/Contacts/components/ContactFilters';
import type { Contact } from '@shared/schema';
import { BackButton } from '@/shared/components/BackButton';
import { ContactDialog } from '@/shared/components/ContactDialog';

export function ContactsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [sendingMessageTo, setSendingMessageTo] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [updatingAllPhotos, setUpdatingAllPhotos] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const { toast } = useToast();
  const contactsPerPage = 10;

  // Implementar debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset para primeira página quando buscar
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hooks
  const { data: contacts, isLoading, isFetching, refetch } = useContacts({ 
    search: debouncedSearch,
    page: currentPage,
    limit: contactsPerPage 
  });
  
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: whatsappChannels } = useActiveWhatsAppChannels();

  // Dados calculados
  const totalContacts = contacts?.total || 0;
  const totalPages = Math.ceil(totalContacts / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const isWhatsAppAvailable = whatsappChannels && whatsappChannels.length > 0;

  // Handlers
  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || ''
    });
  };

  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleStartConversation = (contact: Contact) => {
    setSendingMessageTo(contact);
    setMessageText('');
    // Se há apenas um canal, seleciona automaticamente
    if (whatsappChannels && whatsappChannels.length === 1) {
      setSelectedChannelId(whatsappChannels[0].id);
    } else {
      setSelectedChannelId(null);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      await updateContact.mutateAsync({
        id: editingContact.id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone
      });
      
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!",
      });
      
      setEditingContact(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar contato. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingContact) return;

    try {
      await deleteContact.mutateAsync(deletingContact.id);
      
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!",
      });
      
      setDeletingContact(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir contato. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!sendingMessageTo || !messageText.trim()) return;
    
    if (!selectedChannelId && whatsappChannels && whatsappChannels.length > 1) {
      toast({
        title: "Selecione um canal",
        description: "Escolha qual canal WhatsApp usar para enviar a mensagem.",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      const channelToUse = selectedChannelId || (whatsappChannels && whatsappChannels.length === 1 ? whatsappChannels[0].id : null);
      
      const response = await fetch('/api/utilities/send-whatsapp-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: sendingMessageTo.phone,
          message: messageText.trim(),
          channelId: channelToUse
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      toast({
        title: "Mensagem enviada",
        description: "Mensagem WhatsApp enviada com sucesso!",
      });
      
      setSendingMessageTo(null);
      setMessageText('');
      setSelectedChannelId(null);
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: error instanceof Error ? error.message : "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSyncContacts = async () => {
    setSyncingContacts(true);
    try {
      const response = await fetch('/api/webhooks/zapi/import-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar contatos');
      }

      const result = await response.json();
      toast({
        title: "Sincronização concluída",
        description: `${result.imported} contatos importados, ${result.skipped} ignorados`,
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Erro ao sincronizar contatos do WhatsApp. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSyncingContacts(false);
    }
  };

  const handleUpdateAllPhotos = async () => {
    setUpdatingAllPhotos(true);
    try {
      const response = await fetch('/api/contacts/update-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar fotos');
      }

      const result = await response.json();
      toast({
        title: "Fotos atualizadas",
        description: `${result.updated} fotos de perfil atualizadas`,
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Erro na atualização",
        description: "Erro ao atualizar fotos dos contatos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdatingAllPhotos(false);
    }
  };

  const handleUpdatePhoto = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/photo`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar foto do contato');
      }

      const result = await response.json();
      
      if (result.updated) {
        toast({
          title: "Foto atualizada",
          description: "Foto do contato atualizada via WhatsApp",
        });
        refetch();
      } else {
        toast({
          title: "Foto não encontrada",
          description: "Não foi possível obter a foto do WhatsApp para este contato",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto do contato. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleExportContacts = async () => {
    try {
      const response = await fetch('/api/contacts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactIds: selectedContacts }),
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar contatos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contatos.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export concluído",
        description: `${selectedContacts.length} contatos exportados com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Erro ao exportar contatos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (isLoading && !contacts) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary mx-auto mb-4"></div>
          <p className="text-educhat-medium">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <span>Contatos</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-educhat-dark">Lista de contatos</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-educhat-dark">Contatos</h1>
            <p className="text-educhat-medium">Gerencie seus contatos e integração WhatsApp</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-educhat-primary hover:bg-educhat-secondary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>

        {/* Filtros e Ações */}
        <ContactFilters
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          selectedContacts={selectedContacts}
          isWhatsAppAvailable={!!isWhatsAppAvailable}
          onSyncContacts={handleSyncContacts}
          onUpdateAllPhotos={handleUpdateAllPhotos}
          onExportContacts={handleExportContacts}
          updatingAllPhotos={updatingAllPhotos}
          syncingContacts={syncingContacts}
        />

        {/* Lista de Contatos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Contatos ({totalContacts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contacts?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum contato encontrado</p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="mt-4 bg-educhat-primary hover:bg-educhat-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro contato
                  </Button>
                </div>
              ) : (
                contacts?.data?.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <ContactAvatar
                          src={contact.profileImageUrl}
                          name={contact.name}
                          size="md"
                          className="w-10 h-10"
                        />
                        
                        {isWhatsAppAvailable && contact.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full bg-white border border-gray-200 hover:bg-gray-50"
                            onClick={() => handleUpdatePhoto(contact.id)}
                            title="Atualizar foto do WhatsApp"
                          >
                            <Camera className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {contact.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {contact.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" 
                        title="Ver detalhes"
                        onClick={() => handleViewContact(contact)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700" 
                        title="Editar"
                        onClick={() => handleEditContact(contact)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700" 
                        title="Enviar mensagem"
                        onClick={() => handleStartConversation(contact)}
                        disabled={!contact.phone || !isWhatsAppAvailable}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700" 
                        title="Excluir"
                        onClick={() => handleDeleteContact(contact)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalContacts > 0 && (
              <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalContacts)} de {totalContacts} contatos
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  {/* Páginas numeradas */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageClick(page)}
                        className={page === currentPage ? "bg-educhat-primary text-white" : ""}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Visualização */}
        <Dialog open={!!viewingContact} onOpenChange={(open) => !open && setViewingContact(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Contato</DialogTitle>
            </DialogHeader>
            {viewingContact && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <ContactAvatar
                    src={viewingContact.profileImageUrl}
                    name={viewingContact.name}
                    size="lg"
                    className="w-16 h-16"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{viewingContact.name}</h3>
                    <p className="text-gray-600">{viewingContact.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telefone</label>
                    <p className="mt-1">{viewingContact.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Localização</label>
                    <p className="mt-1">{viewingContact.location || 'Não informado'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {viewingContact.tags && viewingContact.tags.length > 0 ? (
                      viewingContact.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Nenhuma tag</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Contato</DialogTitle>
            </DialogHeader>
            {editingContact && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Nome</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingContact(null)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpdateContact}
                    disabled={updateContact.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateContact.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Exclusão */}
        <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o contato "{deletingContact?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteContact.isPending}
              >
                {deleteContact.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Envio de Mensagem */}
        <Dialog open={!!sendingMessageTo} onOpenChange={(open) => !open && setSendingMessageTo(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enviar Mensagem para {sendingMessageTo?.name}</DialogTitle>
            </DialogHeader>
            {sendingMessageTo && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <ContactAvatar
                    src={sendingMessageTo.profileImageUrl}
                    name={sendingMessageTo.name}
                    size="md"
                    className="w-10 h-10"
                  />
                  <div>
                    <h4 className="font-medium">{sendingMessageTo.name}</h4>
                    <p className="text-sm text-gray-600">{sendingMessageTo.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Mensagem</label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSendingMessageTo(null);
                      setMessageText('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageText.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {sendingMessage ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Criação de Contatos */}
        <ContactDialog 
          isOpen={isCreating} 
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            refetch();
            setIsCreating(false);
          }}
        />
      </div>
    </div>
  );
}