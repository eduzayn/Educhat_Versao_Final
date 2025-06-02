import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Dialog, DialogTrigger } from '@/shared/ui/ui/dialog';
import { ChevronRight, Plus } from 'lucide-react';
import { useContacts, useUpdateContact, useCreateContact, useDeleteContact, useImportZApiContacts, useZApiContactMetadata, useZApiProfilePicture } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import type { Contact } from '@shared/schema';
import { BackButton } from '@/shared/components/BackButton';

// Componentes modularizados
import { ContactFilters } from './components/ContactFilters';
import { ContactList } from './components/ContactList';
import { ContactPagination } from './components/ContactPagination';
import { CreateContactDialog } from './components/CreateContactDialog';
import { ViewContactDialog } from './components/ViewContactDialog';
import { DeleteContactDialog } from './components/DeleteContactDialog';

export function ContactsPageRefactored() {
  // Estados principais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 50;

  // Estados dos modais
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do formulário de criação
  const [createForm, setCreateForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    company: '', 
    address: '', 
    contactType: 'Lead', 
    owner: '', 
    notes: '' 
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Estados de loading
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | null>(null);
  const [updatingAllPhotos, setUpdatingAllPhotos] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);

  const { toast } = useToast();
  
  // Hooks de dados
  const { data: contacts = [], isLoading: isLoadingContacts, refetch: refetchContacts } = useContacts();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const importZApiContactsMutation = useImportZApiContacts();
  const { data: contactMetadata } = useZApiContactMetadata(selectedContactPhone);
  const updateProfilePictureMutation = useZApiProfilePicture();

  // Z-API
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  const isWhatsAppAvailable = zapiStatus === 'connected' && isConfigured;

  // Filtros e paginação
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.phone && contact.phone.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage);

  // Handlers
  const handleSelectContact = (contactId: number, selected: boolean) => {
    setSelectedContacts(prev => 
      selected 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedContacts(selected ? paginatedContacts.map(c => c.id) : []);
  };

  const handleCreateContact = async () => {
    try {
      await createContactMutation.mutateAsync({
        ...createForm,
        tags: newTags
      });
      
      setIsCreating(false);
      setCreateForm({ 
        name: '', email: '', phone: '', company: '', address: '', 
        contactType: 'Lead', owner: '', notes: '' 
      });
      setNewTags([]);
      setCurrentTag('');
      
      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContactMutation.mutateAsync(contactToDelete.id);
      setContactToDelete(null);
      
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato",
        variant: "destructive"
      });
    }
  };

  const handleSyncContacts = async () => {
    if (!isWhatsAppAvailable) {
      toast({
        title: "WhatsApp não conectado",
        description: "Configure o WhatsApp nas configurações primeiro",
        variant: "destructive"
      });
      return;
    }

    setSyncingContacts(true);
    try {
      await importZApiContactsMutation.mutateAsync();
      await refetchContacts();
      
      toast({
        title: "Sucesso",
        description: "Contatos sincronizados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível sincronizar os contatos",
        variant: "destructive"
      });
    } finally {
      setSyncingContacts(false);
    }
  };

  const handleUpdatePhoto = async (phone: string) => {
    try {
      await updateProfilePictureMutation.mutateAsync(phone);
      await refetchContacts();
      
      toast({
        title: "Sucesso",
        description: "Foto atualizada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAllPhotos = async () => {
    if (!isWhatsAppAvailable) {
      toast({
        title: "WhatsApp não conectado",
        description: "Configure o WhatsApp nas configurações primeiro",
        variant: "destructive"
      });
      return;
    }

    setUpdatingAllPhotos(true);
    try {
      const contactsWithPhone = filteredContacts.filter(c => c.phone);
      
      for (const contact of contactsWithPhone) {
        try {
          await updateProfilePictureMutation.mutateAsync(contact.phone!);
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        } catch (error) {
          console.warn(`Erro ao atualizar foto do contato ${contact.name}:`, error);
        }
      }
      
      await refetchContacts();
      
      toast({
        title: "Sucesso",
        description: "Fotos atualizadas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar algumas fotos",
        variant: "destructive"
      });
    } finally {
      setUpdatingAllPhotos(false);
    }
  };

  const handleExportContacts = () => {
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Empresa', 'Tipo', 'Responsável'].join(','),
      ...selectedContactsData.map(contact => [
        contact.name,
        contact.email || '',
        contact.phone || '',
        (contact as any).company || '',
        (contact as any).contactType || '',
        (contact as any).owner || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contatos_exportados.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sucesso",
      description: `${selectedContacts.length} contatos exportados!`
    });
  };

  if (isLoadingContacts) {
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
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-educhat-primary hover:bg-educhat-secondary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Filtros */}
        <ContactFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedContacts={selectedContacts}
          isWhatsAppAvailable={isWhatsAppAvailable}
          onSyncContacts={handleSyncContacts}
          onUpdateAllPhotos={handleUpdateAllPhotos}
          onExportContacts={handleExportContacts}
          updatingAllPhotos={updatingAllPhotos}
          syncingContacts={syncingContacts}
        />

        {/* Lista de contatos */}
        <ContactList
          contacts={paginatedContacts}
          selectedContacts={selectedContacts}
          onSelectContact={handleSelectContact}
          onSelectAll={handleSelectAll}
          onViewContact={(contact) => {
            setViewingContact(contact);
            setSelectedContactPhone(contact.phone);
          }}
          onEditContact={(contact) => {
            // TODO: Implementar modal de edição
            console.log('Edit contact:', contact);
          }}
          onDeleteContact={setContactToDelete}
          onUpdatePhoto={handleUpdatePhoto}
          isWhatsAppAvailable={isWhatsAppAvailable}
        />

        {/* Paginação */}
        <ContactPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalContacts={filteredContacts.length}
          contactsPerPage={contactsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* Modais */}
        <CreateContactDialog
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreateContact}
          form={createForm}
          onFormChange={setCreateForm}
          newTags={newTags}
          onTagsChange={setNewTags}
          currentTag={currentTag}
          onCurrentTagChange={setCurrentTag}
          isWhatsAppAvailable={isWhatsAppAvailable}
          isCreating={createContactMutation.isPending}
        />

        <ViewContactDialog
          contact={viewingContact}
          isOpen={!!viewingContact}
          onClose={() => {
            setViewingContact(null);
            setSelectedContactPhone(null);
          }}
          metadata={contactMetadata}
        />

        <DeleteContactDialog
          contact={contactToDelete}
          isOpen={!!contactToDelete}
          onClose={() => setContactToDelete(null)}
          onConfirm={handleDeleteContact}
          isDeleting={deleteContactMutation.isPending}
        />
      </div>
    </div>
  );
}